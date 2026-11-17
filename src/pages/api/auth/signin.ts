import type { NextApiRequest, NextApiResponse } from 'next';
import { body, methodNotAllowed, send } from '@/server/http';
import {
  clearAttempts,
  createSession,
  normaliseEmail,
  recordFailedAttempt,
  tooManyAttempts,
  userPayload,
  verifyPassword,
} from '@/server/auth';
import { findUserByEmail } from '@/server/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const input = body<{ email?: unknown; password?: unknown }>(req);
  const email = normaliseEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local';
  const key = `${ip}:${email}`;

  if (tooManyAttempts(key)) {
    return send(res, 429, { error: 'Too many attempts. Try again in a few minutes.' });
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailedAttempt(key);
    return send(res, 401, { error: user ? 'That password does not match.' : 'No account found with that email.' });
  }

  clearAttempts(key);
  await createSession(res, user.id);
  send(res, 200, { user: await userPayload(user) });
}
