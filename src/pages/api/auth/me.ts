import type { NextApiRequest, NextApiResponse } from 'next';
import { methodNotAllowed, send } from '@/server/http';
import { currentUser, userPayload } from '@/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const user = await currentUser(req);
  if (!user) return send(res, 200, { user: null });
  send(res, 200, { user: await userPayload(user) });
}
