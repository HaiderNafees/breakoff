import Link from 'next/link';
import { formatPrice, getProduct } from '@/data';
import type { Order } from '@/lib/account';

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
        <span className="order__status">{order.status}</span>
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
          {order.delivery} · {order.payment} · {order.address.city}
        </p>
        <p className="order__total">
          <span>Total</span>
          <strong>{formatPrice(order.total)}</strong>
        </p>
      </footer>
    </article>
  );
}
