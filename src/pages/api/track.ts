import type { NextApiRequest, NextApiResponse } from 'next';
import { methodNotAllowed, send } from '@/server/http';
import { currentUser } from '@/server/auth';
import { findOrder, publicOrder, readStore } from '@/server/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const number = typeof req.query.number === 'string' ? req.query.number.trim() : '';
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  if (!number) return send(res, 400, { error: 'Enter an order number.' });

  const data = await readStore();
  const order = findOrder(data, number);
  if (!order) return send(res, 404, { error: 'No order with that number. Check the confirmation email.' });

  const session = await currentUser(req);
  const owner = Boolean(session && order.userId === session.id);
  if (!owner && (!email || email !== order.email)) {
    return send(res, 403, {
      error: email
        ? 'That order number and email do not match. Try the email you ordered with.'
        : 'Enter the email address used for this order.',
    });
  }

  send(res, 200, { order: publicOrder(order) });
}
