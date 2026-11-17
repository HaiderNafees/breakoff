import type { NextApiRequest, NextApiResponse } from 'next';
import { body, methodNotAllowed, send } from '@/server/http';
import { currentUser, userPayload } from '@/server/auth';
import { updateUser } from '@/server/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH']);

  const session = await currentUser(req);
  if (!session) return send(res, 401, { error: 'Sign in to continue.' });

  const input = body<{ name?: unknown }>(req);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 2) return send(res, 400, { error: 'Name cannot be empty.' });

  const updated = await updateUser(session.id, (user) => {
    user.name = name;
  });

  if (!updated) return send(res, 404, { error: 'Account not found.' });
  send(res, 200, { user: await userPayload(updated) });
}
