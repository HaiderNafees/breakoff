import Link from 'next/link';
import { formatPrice, getProduct } from '@/data';
import type { Order } from '@/lib/types';
import { DELIVERY_LABEL, PAYMENT_LABEL, STATUS_LABEL } from '@/lib/types';

export function orderDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrderCard({ order }: { order: Order }) {
  return (
    <article className="order">
      <header className="order__head">
        <div>
          <p className="order__id">Order {order.id}</p>
          <p className="order__date">{orderDate(order.placedAt)}</p>
        </div>
        <span className={`order__status order__status--${order.status}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <ul className="order__lines">
        {order.lines.map((line) => {
          const product = getProduct(line.slug);
          return (
            <li key={`${order.id}-${line.slug}-${line.size}`} className="order__line">
              <Link href={`/product/${line.slug}`} className="order__thumb">
                {line.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.image} alt={line.name} loading="lazy" decoding="async" />
                ) : (
                  <span aria-hidden="true" />
                )}
              </Link>
              <div className="order__detail">
                <p className="order__name">
                  <Link href={`/product/${line.slug}`}>{line.name}</Link>
                </p>
                <p className="order__meta">
                  Size {line.size} · Qty {line.qty}
                  {product ? ` · ${product.colorway}` : ''}
                </p>
              </div>
              <p className="order__price">{formatPrice(line.price * line.qty)}</p>
            </li>
          );
        })}
      </ul>

      <footer className="order__foot">
        <p className="order__meta">
          {DELIVERY_LABEL[order.delivery]} · {PAYMENT_LABEL[order.payment]} · {order.address.city}
        </p>
        <p className="order__total">
          <span>Total</span>
          <strong>{formatPrice(order.total)}</strong>
        </p>
      </footer>

      <div className="order__track">
        <span className="order__track-label">
          {order.status === 'delivered'
            ? 'Delivered — 14-day returns apply'
            : order.trackingNumber
              ? `Tracking ${order.trackingNumber}`
              : 'Track this order'}
        </span>
        <Link
          href={`/track?number=${encodeURIComponent(order.id)}`}
          className="link-underline link-underline--sm"
        >
          Follow its progress
        </Link>
      </div>
    </article>
  );
}
