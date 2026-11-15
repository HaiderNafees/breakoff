import type { NextApiRequest, NextApiResponse } from 'next';
import { methodNotAllowed, send } from '@/server/http';
import { markPaid } from '@/server/orders';
import { publicOrder } from '@/server/store';
import { getStripe } from '@/server/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
  if (!sessionId) return send(res, 400, { error: 'Missing session id.' });

  const stripe = getStripe();
  if (!stripe) return send(res, 503, { error: 'Payments are not configured.' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId || session.client_reference_id || '';
    if (!orderId) return send(res, 404, { error: 'That payment has no matching order.' });

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const order = await markPaid(orderId, session.id);
      if (!order) return send(res, 404, { error: 'That payment has no matching order.' });
      return send(res, 200, { order: publicOrder(order), pending: false });
    }

    return send(res, 200, { order: null, pending: true });
  } catch (error) {
    console.error('[checkout] session lookup failed', error);
    send(res, 502, { error: 'We could not verify that payment yet.' });
  }
}
