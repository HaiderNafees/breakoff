import crypto from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createSession as saveSession,
  deleteSession as removeSession,
  findSession,
  getUser,
  ordersFor,
  publicOrder,
  type StoredOrder,
  type StoredUser,
} from './store';
import type { User } from '@/lib/types';

export const SESSION_COOKIE = 'bo_session';
const SESSION_DAYS = 30;

/* ---------- passwords ---------- */

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !digest) return false;
  const expected = Buffer.from(digest, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/* ---------- sessions ---------- */

function digestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function serialiseCookie(value: string, maxAge: number): string {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export async function createSession(res: NextApiResponse, userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await saveSession({
    tokenHash: digestToken(token),
    userId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  });
  res.setHeader('Set-Cookie', serialiseCookie(token, SESSION_DAYS * 24 * 60 * 60));
}

export async function destroySession(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const token = req.cookies[SESSION_COOKIE];
  if (token) {
    await removeSession(digestToken(token));
  }
  res.setHeader('Set-Cookie', serialiseCookie('', 0));
}

export async function currentUser(req: NextApiRequest): Promise<StoredUser | null> {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return null;
  const session = await findSession(digestToken(token));
  if (!session) return null;
  if (session.expiresAt <= new Date().toISOString()) return null;
  return getUser(session.userId);
}

export function toPublicUser(user: StoredUser, orders: StoredOrder[]): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    addresses: user.addresses,
    orders: orders.map(publicOrder),
  };
}

export async function userPayload(user: StoredUser): Promise<User> {
  return toPublicUser(user, await ordersFor(user.id));
}

/** Small in-memory brake on password guessing. Resets when the process does. */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= 8;
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) {
    attempts.set(key, { count: 1, resetAt: Date.now() + 10 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

export function normaliseEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

