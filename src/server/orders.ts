import crypto from 'node:crypto';
import { getProduct } from '@/data';
import { shippingFor } from '@/lib/shipping';
import type { Address, DeliveryMethod, Order, OrderEvent, OrderStatus, PaymentMethod } from '@/lib/types';
import { findOrder, mutate, type StoredOrder } from './store';

export type CheckoutLine = { slug: string; size: string; qty: number };

export type CheckoutInput = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  province?: unknown;
  postal?: unknown;
  delivery?: unknown;
  payment?: unknown;
  lines?: unknown;
  saveAddress?: unknown;
};

export type CheckoutResult = { error: string } | { order: StoredOrder };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function orderNumber(existing: Set<string>): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const bytes = crypto.randomBytes(6);
    const id = `BO-${Array.from(bytes)
      .map((byte) => alphabet[byte % alphabet.length])
      .join('')}`;
    if (!existing.has(id)) return id;
  }
}

function trackingNumber(): string {
  return `BOPK${crypto.randomInt(100000000, 999999999)}`;
}

export function isStatus(value: unknown): value is OrderStatus {
  return (
    value === 'placed' ||
    value === 'confirmed' ||
    value === 'packed' ||
    value === 'dispatched' ||
    value === 'out-for-delivery' ||
    value === 'delivered' ||
    value === 'cancelled'
  );
}

/** Prices always come from the catalog, never from the browser. */
export function normaliseLines(input: unknown): { slug: string; name: string; size: string; qty: number; price: number; image?: string }[] {
  if (!Array.isArray(input)) return [];
  const lines: { slug: string; name: string; size: string; qty: number; price: number; image?: string }[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const slug = text(item.slug);
    const size = text(item.size);
    const qty = Number(item.qty);
    const product = getProduct(slug);
    if (!product || !size || !Number.isFinite(qty) || qty < 1) continue;
    if (!product.sizes.includes(size)) continue;
    const clamped = Math.min(Math.floor(qty), 10);
    const existing = lines.find((line) => line.slug === slug && line.size === size);
    if (existing) existing.qty = Math.min(existing.qty + clamped, 10);
    else
      lines.push({
        slug,
        name: product.name,
        size,
        qty: clamped,
        price: product.price,
        image: product.images?.[0],
      });
  }
  return lines;
}

export function validateCheckout(input: CheckoutInput): { error: string } | {
  email: string;
  address: Address;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  lines: ReturnType<typeof normaliseLines>;
} {
  const email = text(input.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Enter a valid email address.' };

  const firstName = text(input.firstName);
  const lastName = text(input.lastName);
  const name = `${firstName} ${lastName}`.trim();
  const phone = text(input.phone);
  const line1 = text(input.line1);
  const city = text(input.city);
  const province = text(input.province) || 'Punjab';
  const postal = text(input.postal);

  if (!firstName || !lastName) return { error: 'A first and last name are required.' };
  if (phone.replace(/\D/g, '').length < 10) return { error: 'Enter a valid phone number.' };
  if (!line1) return { error: 'A street address is required.' };
  if (!city) return { error: 'A city is required.' };
  if (postal && !/^\d{4,6}$/.test(postal)) return { error: 'The postal code should be 4–6 digits.' };

  const delivery: DeliveryMethod = input.delivery === 'express' ? 'express' : 'standard';
  const payment: PaymentMethod = input.payment === 'cod' ? 'cod' : 'card';

  const lines = normaliseLines(input.lines);
  if (lines.length === 0) return { error: 'Your bag is empty.' };

  return {
    email,
    delivery,
    payment,
    lines,
    address: {
      id: `a_${crypto.randomBytes(6).toString('hex')}`,
      label: 'Checkout',
      name,
      phone,
      line1,
      line2: text(input.line2) || undefined,
      city,
      province,
      postal,
    },
  };
}

export async function createOrder(
  input: CheckoutInput,
  userId: string | null
): Promise<CheckoutResult> {
  const valid = validateCheckout(input);
  if ('error' in valid) return { error: valid.error };

  const subtotal = valid.lines.reduce((total, line) => total + line.price * line.qty, 0);
  const shipping = shippingFor(subtotal, valid.delivery);
  const now = new Date().toISOString();

  return mutate((data) => {
    const used = new Set<string>(data.orders.map((order) => order.id));
    const pending: StoredOrder = {
      id: orderNumber(used),
      placedAt: now,
      lines: valid.lines,
      subtotal,
      shipping,
      total: subtotal + shipping,
      email: valid.email,
      address: valid.address,
      delivery: valid.delivery,
      payment: valid.payment,
      paymentStatus: valid.payment === 'cod' ? 'pending' : 'pending',
      status: 'placed',
      events: [{ status: 'placed', at: now, note: 'Order received.' }],
      userId,
    };
    data.orders.push(pending);

    // Remember the delivery address for signed-in customers, replacing a
    // matching one rather than piling up duplicates.
    if (userId) {
      const user = data.users.find((item) => item.id === userId);
      if (user) {
        const same = user.addresses.find(
          (address) =>
            address.line1.toLowerCase() === valid.address.line1.toLowerCase() &&
            address.city.toLowerCase() === valid.address.city.toLowerCase()
        );
        if (same) {
          user.addresses = user.addresses.map((address) => (address.id === same.id ? valid.address : address));
        } else {
          user.addresses = [...user.addresses, { ...valid.address, label: user.addresses.length ? 'Delivery' : 'Home' }];
        }
      }
    }

    return { order: pending };
  });
}

/** Move an order along the tracking ladder, recording who did it and when. */
export function advanceOrder(
  id: string,
  status: OrderStatus,
  note?: string,
  tracking?: string
): Promise<{ order: StoredOrder } | { error: string }> {
  return mutate((data) => {
    const order = findOrder(data, id);
    if (!order) return { error: 'No order with that number.' };
    if (order.status === status) return { order };
    if (order.status === 'cancelled') return { error: 'This order was cancelled.' };
    if (status === 'delivered' && order.status !== 'out-for-delivery' && order.status !== 'dispatched') {
      return { error: 'An order has to be dispatched before it can be delivered.' };
    }

    const at = new Date().toISOString();
    const event: OrderEvent = { status, at };
    if (note) event.note = note;
    if (status === 'dispatched') {
      order.trackingNumber = tracking || order.trackingNumber || trackingNumber();
      order.carrier = 'BreakOff Courier, Lahore';
    }
    if (status === 'delivered') order.paymentStatus = 'paid';
    if (status === 'cancelled') order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'unpaid';
    order.status = status;
    order.events = [...order.events, event];
    return { order };
  });
}

export function markPaid(id: string, sessionId?: string): Promise<StoredOrder | null> {
  return mutate((data) => {
    const order = findOrder(data, id);
    if (!order) return null;
    const at = new Date().toISOString();
    if (sessionId) order.stripeSessionId = sessionId;
    order.paymentStatus = 'paid';
    if (!order.events.some((event) => event.status === 'confirmed')) {
      order.events = [...order.events, { status: 'confirmed', at, note: 'Payment received through Stripe.' }];
      order.status = 'confirmed';
    }
    return order;
  });
}

export function markPaymentFailed(id: string): Promise<void> {
  return mutate((data) => {
    const order = findOrder(data, id);
    if (order && order.paymentStatus !== 'paid') order.paymentStatus = 'unpaid';
  });
}
