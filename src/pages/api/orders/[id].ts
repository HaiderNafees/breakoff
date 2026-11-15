import type { NextApiRequest, NextApiResponse } from 'next';
import { methodNotAllowed, send } from '@/server/http';
import { currentUser } from '@/server/auth';
import { findOrder, publicOrder, readStore } from '@/server/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const data = await readStore();
  const order = findOrder(data, id);
  if (!order) return send(res, 404, { error: 'No order with that number.' });

  const session = await currentUser(req);
  const owns = session && order.userId === session.id;
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  if (!owns && (!email || email !== order.email)) {
    return send(res, 403, { error: 'That order does not match this email address.' });
  }

  send(res, 200, { order: publicOrder(order) });
}
