import fs from 'node:fs/promises';
import path from 'node:path';
import type { Address, Order } from '@/lib/types';

/**
 * A tiny file-backed store. Every write is serialised through a promise queue
 * and lands atomically (write to a temp file, then rename), so concurrent
 * requests cannot corrupt the record.
 *
 * It is deliberately the only module that knows where data lives: swapping this
 * for Postgres later means rewriting these functions and nothing else.
 */

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  addresses: Address[];
};

export type StoredOrder = Order & { userId: string | null };

export type StoredSession = {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type Data = {
  version: 1;
  users: StoredUser[];
  orders: StoredOrder[];
  sessions: StoredSession[];
};

const DATA_DIR = process.env.BREAKOFF_DATA_DIR || path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const EMPTY: Data = { version: 1, users: [], orders: [], sessions: [] };

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
    if (code === 'ENOENT') return { ...EMPTY, users: [], orders: [], sessions: [] };
    throw error;
  }
}

async function save(data: Data): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(temp, DATA_FILE);
}

/**
 * Read a snapshot without writing. Callers must treat the result as immutable.
 */
export async function readStore(): Promise<Data> {
  return load();
}

/**
 * Run a mutation against the store. The callback receives a private copy it may
 * mutate in place; the result is persisted when it returns.
 */
export function mutate<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
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

export function findUserByEmail(data: Data, email: string): StoredUser | undefined {
  const clean = email.trim().toLowerCase();
  return data.users.find((user) => user.email === clean);
}

export function ordersFor(data: Data, userId: string): StoredOrder[] {
  return data.orders
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export function findOrder(data: Data, id: string): StoredOrder | undefined {
  const clean = id.trim().toUpperCase();
  return data.orders.find((order) => order.id.toUpperCase() === clean);
}

export function publicOrder(order: StoredOrder): Order {
  const { userId: _userId, ...rest } = order;
  return rest;
}
