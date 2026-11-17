import fs from 'node:fs/promises';
import path from 'node:path';
import type { Store, StoredOrder, StoredSession, StoredUser } from './store';

/**
 * Local development store. Every write is serialised through a promise queue
 * and lands atomically (write to a temp file, then rename), so concurrent
 * requests cannot corrupt the record. Production uses Postgres instead.
 */

type Data = {
  version: 1;
  users: StoredUser[];
  orders: StoredOrder[];
  sessions: StoredSession[];
};

const DATA_DIR = process.env.BREAKOFF_DATA_DIR || path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const empty = (): Data => ({ version: 1, users: [], orders: [], sessions: [] });

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Data> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Data>;
    return {
      version: 1,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return empty();
    throw error;
  }
}

async function save(data: Data): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(temp, DATA_FILE);
}

function mutate<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

export const backend: Store = {
  async findUserByEmail(email) {
    const clean = email.trim().toLowerCase();
    const data = await load();
    return data.users.find((user) => user.email === clean) ?? null;
  },

  async getUser(id) {
    const data = await load();
    return data.users.find((user) => user.id === id) ?? null;
  },

  createUser(user) {
    return mutate((data) => {
      if (data.users.some((item) => item.email === user.email)) return false;
      data.users.push(structuredClone(user));
      return true;
    });
  },

  updateUser(id, apply) {
    return mutate((data) => {
      const user = data.users.find((item) => item.id === id);
      if (!user) return null;
      apply(user);
      return user;
    });
  },

  createSession(session) {
    return mutate((data) => {
      const now = new Date().toISOString();
      data.sessions = data.sessions.filter((item) => item.expiresAt > now);
      data.sessions.push({ ...session });
    });
  },

  async findSession(tokenHash) {
    const data = await load();
    return data.sessions.find((session) => session.tokenHash === tokenHash) ?? null;
  },

  deleteSession(tokenHash) {
    return mutate((data) => {
      data.sessions = data.sessions.filter((session) => session.tokenHash !== tokenHash);
    });
  },

  createOrder(order) {
    return mutate((data) => {
      if (data.orders.some((item) => item.id === order.id)) return false;
      data.orders.push(structuredClone(order));
      return true;
    });
  },

  async findOrder(id) {
    const clean = id.trim().toUpperCase();
    const data = await load();
    return data.orders.find((order) => order.id === clean) ?? null;
  },

  updateOrder(id, apply) {
    return mutate((data) => {
      const clean = id.trim().toUpperCase();
      const order = data.orders.find((item) => item.id === clean);
      if (!order) return null;
      apply(order);
      return order;
    });
  },

  async ordersFor(userId) {
    const data = await load();
    return data.orders.filter((order) => order.userId === userId).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  },
};
