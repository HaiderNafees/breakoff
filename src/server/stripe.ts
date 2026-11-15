import Stripe from 'stripe';
import type { StoredOrder } from './store';
import { DELIVERY_LABEL } from '@/lib/types';

let client: Stripe | null = null;

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key, { typescript: true });
  return client;
}

function siteUrl(): string {
  return (
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  );
}

/**
 * Creates a hosted Stripe Checkout session for an order. Card details never
 * touch this app: Stripe collects them on its own page.
 */
export async function createCheckoutSession(order: StoredOrder): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const summary = order.lines.map((line) => `${line.name} (${line.size}) ×${line.qty}`).join(', ');
  const origin = siteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'pkr',
          unit_amount: order.subtotal * 100,
          product_data: {
            name: `BreakOff order ${order.id}`,
            description: summary.slice(0, 400),
          },
        },
      },
      ...(order.shipping > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: 'pkr',
                unit_amount: order.shipping * 100,
                product_data: { name: DELIVERY_LABEL[order.delivery] },
              },
            },
          ]
        : []),
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?payment=cancelled`,
  });

  return session.url;
}
