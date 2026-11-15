import crypto from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { body, methodNotAllowed, send } from '@/server/http';
import { createSession, findUserByEmail, hashPassword, normaliseEmail, toPublicUser } from '@/server/auth';
import { mutate, ordersFor, readStore } from '@/server/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const input = body<{ name?: unknown; email?: unknown; password?: unknown }>(req);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = normaliseEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';

  if (name.length < 2) return send(res, 400, { error: 'Please add your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return send(res, 400, { error: 'Enter a valid email address.' });
  }
  if (password.length < 6) {
    return send(res, 400, { error: 'Use at least 6 characters for your password.' });
  }

  const created = await mutate((data) => {
    if (findUserByEmail(data, email)) return null;
    const user = {
      id: `u_${crypto.randomBytes(8).toString('hex')}`,
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      addresses: [],
    };
    data.users.push(user);
    return user;
  });

  if (!created) {
    return send(res, 409, { error: 'An account with this email already exists.' });
  }

  await createSession(res, created.id);
  const data = await readStore();
  send(res, 201, { user: toPublicUser(created, ordersFor(data, created.id)) });
}
