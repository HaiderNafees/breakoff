import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';
import { markPaid, markPaymentFailed } from '@/server/orders';
import { getStripe } from '@/server/stripe';

/** Stripe signs the raw body, so parsing has to be disabled for this route. */
export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return res.status(503).json({ error: 'Stripe webhooks are not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') return res.status(400).json({ error: 'Missing signature.' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), signature, secret);
  } catch (error) {
    console.error('[stripe] signature verification failed', error);
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId) await markPaid(orderId, session.id);
    }
    if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId) await markPaymentFailed(orderId);
    }
  } catch (error) {
    console.error('[stripe] handler failed', error);
    return res.status(500).json({ error: 'Webhook handling failed.' });
  }

  res.status(200).json({ received: true });
}
