import type { Address, Order } from '@/lib/types';
import * as fileBackend from './store-file';
import * as postgresBackend from './store-postgres';

/**
 * Where accounts, sessions and orders live.
 *
 * With `DATABASE_URL` set everything goes to Postgres (Neon, Supabase, or any
 * other provider — the SQL is plain Postgres). Without it, local development
 * falls back to a JSON file in `.data`, so `npm run dev` needs no database.
 *
 * Routes only ever call the functions exported at the bottom of this file, so
 * the two backends can be swapped without touching the rest of the app.
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

export type Store = {
  findUserByEmail(email: string): Promise<StoredUser | null>;
  getUser(id: string): Promise<StoredUser | null>;
  /** Returns false when the email is already taken. */
  createUser(user: StoredUser): Promise<boolean>;
  /** Applies the mutation under a lock, then persists it. */
  updateUser(id: string, apply: (user: StoredUser) => void): Promise<StoredUser | null>;

  createSession(session: StoredSession): Promise<void>;
  findSession(tokenHash: string): Promise<StoredSession | null>;
  deleteSession(tokenHash: string): Promise<void>;

  /** Returns false when the order number is already taken. */
  createOrder(order: StoredOrder): Promise<boolean>;
  findOrder(id: string): Promise<StoredOrder | null>;
  updateOrder(id: string, apply: (order: StoredOrder) => void): Promise<StoredOrder | null>;
  ordersFor(userId: string): Promise<StoredOrder[]>;
};

export function publicOrder(order: StoredOrder): Order {
  const { userId: _userId, ...rest } = order;
  return rest;
}

export const usingPostgres = (): boolean => Boolean(process.env.DATABASE_URL);

const backend: Store = usingPostgres() ? postgresBackend.backend : fileBackend.backend;

export const findUserByEmail = (email: string) => backend.findUserByEmail(email);
export const getUser = (id: string) => backend.getUser(id);
export const createUser = (user: StoredUser) => backend.createUser(user);
export const updateUser = (id: string, apply: (user: StoredUser) => void) => backend.updateUser(id, apply);

export const createSession = (session: StoredSession) => backend.createSession(session);
export const findSession = (tokenHash: string) => backend.findSession(tokenHash);
export const deleteSession = (tokenHash: string) => backend.deleteSession(tokenHash);

export const createOrder = (order: StoredOrder) => backend.createOrder(order);
export const findOrder = (id: string) => backend.findOrder(id);
export const updateOrder = (id: string, apply: (order: StoredOrder) => void) => backend.updateOrder(id, apply);
export const ordersFor = (userId: string) => backend.ordersFor(userId);
