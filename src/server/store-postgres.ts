import { Pool, type PoolClient } from 'pg';
import type { Address, Order } from '@/lib/types';
import type { Store, StoredOrder, StoredUser } from './store';

/**
 * Postgres backend. Plain SQL with no provider-specific features, so it works
 * on Neon, Supabase, or any managed Postgres.
 *
 * Schema is created on first use (`create table if not exists`), which makes a
 * fresh database work without a migration step. Writes that read before they
 * write (order status, addresses) run inside a transaction with `for update`.
 */

const SCHEMA = `
create table if not exists bo_users (
  id text primary key,
  email text not null,
  name text not null,
  password_hash text not null,
  addresses jsonb not null default '[]'::jsonb,
  created_at text not null
);
create unique index if not exists bo_users_email on bo_users (lower(email));

create table if not exists bo_sessions (
  token_hash text primary key,
  user_id text not null references bo_users(id) on delete cascade,
  created_at text not null,
  expires_at text not null
);
create index if not exists bo_sessions_expires on bo_sessions (expires_at);

create table if not exists bo_orders (
  id text primary key,
  user_id text references bo_users(id) on delete set null,
  email text not null,
  placed_at text not null,
  status text not null,
  payment_status text not null,
  stripe_session_id text,
  data jsonb not null
);
create index if not exists bo_orders_user on bo_orders (user_id, placed_at desc);
create index if not exists bo_orders_email on bo_orders (lower(email));
create unique index if not exists bo_orders_stripe on bo_orders (stripe_session_id)
  where stripe_session_id is not null;
`;

type Global = typeof globalThis & {
  __breakoffPool?: Pool;
  __breakoffSchema?: Promise<void>;
};

const globals = globalThis as Global;

function needsSsl(url: string): boolean {
  if (/sslmode=(require|verify-ca|verify-full)/i.test(url)) return true;
  if (/sslmode=disable/i.test(url)) return false;
  try {
    const host = new URL(url).hostname;
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
  } catch {
    return true;
  }
}

function pool(): Pool {
  if (globals.__breakoffPool) return globals.__breakoffPool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const created = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ...(needsSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  created.on('error', (error) => console.error('[db] idle client failed', error.message));
  globals.__breakoffPool = created;
  return created;
}

/** Create the tables once per process (safe to race across lambdas). */
function ready(): Promise<void> {
  if (!globals.__breakoffSchema) {
    globals.__breakoffSchema = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((error) => {
        globals.__breakoffSchema = undefined;
        throw error;
      });
  }
  return globals.__breakoffSchema;
}

async function query<T extends Record<string, unknown>>(text: string, values: unknown[]): Promise<T[]> {
  await ready();
  const result = await pool().query<T>(text, values);
  return result.rows;
}

async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ready();
  const client = await pool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  addresses: Address[];
  created_at: string;
};

type OrderRow = { user_id: string | null; data: Order };

function userFrom(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    addresses: Array.isArray(row.addresses) ? row.addresses : [],
    createdAt: row.created_at,
  };
}

function orderFrom(row: OrderRow): StoredOrder {
  return { ...row.data, userId: row.user_id ?? null };
}

export const backend: Store = {
  async findUserByEmail(email) {
    const rows = await query<UserRow>('select * from bo_users where lower(email) = lower($1) limit 1', [email.trim()]);
    return rows[0] ? userFrom(rows[0]) : null;
  },

  async getUser(id) {
    const rows = await query<UserRow>('select * from bo_users where id = $1 limit 1', [id]);
    return rows[0] ? userFrom(rows[0]) : null;
  },

  async createUser(user) {
    const rows = await query(
      `insert into bo_users (id, email, name, password_hash, addresses, created_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict do nothing
       returning id`,
      [user.id, user.email, user.name, user.passwordHash, JSON.stringify(user.addresses), user.createdAt]
    );
    return rows.length === 1;
  },

  updateUser(id, apply) {
    return transaction(async (client) => {
      const found = await client.query<UserRow>('select * from bo_users where id = $1 for update', [id]);
      if (found.rowCount === 0) return null;
      const user = userFrom(found.rows[0]);
      apply(user);
      await client.query('update bo_users set name = $2, addresses = $3 where id = $1', [
        id,
        user.name,
        JSON.stringify(user.addresses),
      ]);
      return user;
    });
  },

  async createSession(session) {
    await query('delete from bo_sessions where expires_at < $1', [new Date().toISOString()]);
    await query(
      `insert into bo_sessions (token_hash, user_id, created_at, expires_at)
       values ($1, $2, $3, $4)
       on conflict (token_hash) do update set expires_at = excluded.expires_at`,
      [session.tokenHash, session.userId, session.createdAt, session.expiresAt]
    );
  },

  async findSession(tokenHash) {
    const rows = await query<{ token_hash: string; user_id: string; created_at: string; expires_at: string }>(
      'select * from bo_sessions where token_hash = $1 and expires_at > $2 limit 1',
      [tokenHash, new Date().toISOString()]
    );
    const row = rows[0];
    return row
      ? { tokenHash: row.token_hash, userId: row.user_id, createdAt: row.created_at, expiresAt: row.expires_at }
      : null;
  },

  async deleteSession(tokenHash) {
    await query('delete from bo_sessions where token_hash = $1', [tokenHash]);
  },

  async createOrder(order) {
    const { userId, ...document } = order;
    const rows = await query(
      `insert into bo_orders (id, user_id, email, placed_at, status, payment_status, stripe_session_id, data)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict do nothing
       returning id`,
      [
        order.id,
        userId,
        order.email,
        order.placedAt,
        order.status,
        order.paymentStatus,
        order.stripeSessionId ?? null,
        JSON.stringify(document),
      ]
    );
    return rows.length === 1;
  },

  async findOrder(id) {
    const rows = await query<OrderRow>('select user_id, data from bo_orders where id = $1 limit 1', [id.trim().toUpperCase()]);
    return rows[0] ? orderFrom(rows[0]) : null;
  },

  updateOrder(id, apply) {
    return transaction(async (client) => {
      const found = await client.query<OrderRow>(
        'select user_id, data from bo_orders where id = $1 for update',
        [id.trim().toUpperCase()]
      );
      if (found.rowCount === 0) return null;
      const order = orderFrom(found.rows[0]);
      apply(order);
      const { userId, ...document } = order;
      await client.query(
        `update bo_orders
            set user_id = $2, email = $3, status = $4, payment_status = $5,
                stripe_session_id = $6, data = $7
          where id = $1`,
        [
          order.id,
          userId,
          order.email,
          order.status,
          order.paymentStatus,
          order.stripeSessionId ?? null,
          JSON.stringify(document),
        ]
      );
      return order;
    });
  },

  async ordersFor(userId) {
    const rows = await query<OrderRow>(
      'select user_id, data from bo_orders where user_id = $1 order by placed_at desc',
      [userId]
    );
    return rows.map(orderFrom);
  },
};
