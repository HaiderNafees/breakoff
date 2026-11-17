import type { NextApiRequest, NextApiResponse } from 'next';
import { methodNotAllowed, send } from '@/server/http';
import { currentUser } from '@/server/auth';
import { ordersFor, publicOrder } from '@/server/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const session = await currentUser(req);
  if (!session) return send(res, 401, { error: 'Sign in to see your orders.' });

  send(res, 200, { orders: (await ordersFor(session.id)).map(publicOrder) });
}
