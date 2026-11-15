import type { DeliveryMethod } from '@/lib/types';

export const FREE_SHIPPING_THRESHOLD = 10000;

export const DELIVERY_FEE: Record<DeliveryMethod, number> = { standard: 350, express: 650 };

export function shippingFor(subtotal: number, method: DeliveryMethod): number {
  if (method === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return DELIVERY_FEE[method];
}
