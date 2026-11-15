import type { NextApiRequest, NextApiResponse } from 'next';
import { body, methodNotAllowed, send } from '@/server/http';
import { currentUser } from '@/server/auth';
import { advanceOrder, createOrder, type CheckoutInput } from '@/server/orders';
import { publicOrder } from '@/server/store';
import { createCheckoutSession, stripeEnabled } from '@/server/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const session = await currentUser(req);
  const input = body<CheckoutInput>(req);
  const result = await createOrder(input, session?.id ?? null);

  if ('error' in result) return send(res, 400, { error: result.error });
  const order = result.order;

  if (order.payment === 'card' && stripeEnabled()) {
    try {
      const url = await createCheckoutSession(order);
      if (!url) throw new Error('Stripe did not return a checkout URL.');
      return send(res, 201, {
        order: publicOrder(order),
        checkoutUrl: url,
        stripeEnabled: true,
      });
    } catch (error) {
      console.error('[checkout] Stripe session failed', error);
      await advanceOrder(order.id, 'cancelled', 'Payment provider unavailable.');
      return send(res, 502, {
        error:
          'We could not reach the payment provider, so nothing was charged. Try again, or choose cash on delivery.',
      });
    }
  }

  // No live keys. The order is recorded so the rest of the flow stays complete;
  // the confirmation screen states plainly that no card was charged.
  send(res, 201, {
    order: publicOrder(order),
    checkoutUrl: null,
    stripeEnabled: stripeEnabled(),
  });
}
