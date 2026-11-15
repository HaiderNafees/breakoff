/**
 * Types shared by the browser and the API routes.
 * Keep this file dependency-free: it is bundled into the client.
 */

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal: string;
};

export type OrderLine = {
  slug: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  image?: string;
};

export type DeliveryMethod = 'standard' | 'express';
export type PaymentMethod = 'card' | 'cod';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'dispatched'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'unpaid' | 'refunded';

export type OrderEvent = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type Order = {
  /** Order number, e.g. BO-7K2M9Q */
  id: string;
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  email: string;
  address: Address;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  events: OrderEvent[];
  trackingNumber?: string;
  carrier?: string;
  /** Set when the order was paid through Stripe Checkout. */
  stripeSessionId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  orders: Order[];
  addresses: Address[];
};

/** The tracking ladder an order climbs. Cancelled orders leave the ladder. */
export const ORDER_FLOW: { key: OrderStatus; label: string; note: string }[] = [
  { key: 'placed', label: 'Order placed', note: 'We have your order and delivery details.' },
  { key: 'confirmed', label: 'Confirmed', note: 'Payment or cash-on-delivery is confirmed.' },
  { key: 'packed', label: 'Packed in Lahore', note: 'Wrapped in recycled tissue, boxed by hand.' },
  { key: 'dispatched', label: 'Dispatched', note: 'Handed to the courier with a tracking number.' },
  { key: 'out-for-delivery', label: 'Out for delivery', note: 'On the van, arriving today.' },
  { key: 'delivered', label: 'Delivered', note: 'Signed for. 14-day returns now apply.' },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  dispatched: 'Dispatched',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: 'Card',
  cod: 'Cash on delivery',
};

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  standard: 'Standard delivery, 2–4 working days',
  express: 'Express delivery, 1–2 working days',
};

export function orderStage(order: Order): number {
  if (order.status === 'cancelled') return -1;
  return ORDER_FLOW.findIndex((step) => step.key === order.status);
}

export function eventFor(order: Order, status: OrderStatus): OrderEvent | undefined {
  return order.events.find((event) => event.status === status);
}
