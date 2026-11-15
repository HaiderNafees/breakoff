import Link from 'next/link';
import { useState } from 'react';
import Media from '@/components/Media';
import Seo from '@/components/Seo';
import { formatPrice, getProduct } from '@/data';
import { FREE_SHIPPING_THRESHOLD, useCart } from '@/lib/cart';

export default function CartPage() {
  const { lines, subtotal, setQty, remove, count, ready } = useCart();
  const [notice, setNotice] = useState('');

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 350;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      <Seo title="Bag" description="Your BreakOff bag." path="/cart" />

      <header className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Bag</span>
        </nav>
        <h1 className="page-title">Your bag</h1>
        <p className="page-sub">
          {ready ? `${count} ${count === 1 ? 'piece' : 'pieces'}` : 'Loading'}
        </p>
      </header>

      {!ready ? (
        <div className="cart cart--empty">
          <p className="empty__body">Loading your bag…</p>
        </div>
      ) : lines.length === 0 ? (
        <div className="cart cart--empty">
          <p className="empty__title">Your bag is empty.</p>
          <p className="empty__body">Pieces you add will be held here for this browser.</p>
          <Link href="/shop" className="btn btn--solid">
            Shop all pieces
          </Link>
        </div>
      ) : (
        <div className="cart">
          <div className="cart__lines">
            {lines.map((line) => {
              const product = getProduct(line.slug);
              if (!product) return null;
              return (
                <article key={`${line.slug}-${line.size}`} className="cart__line">
                  <Link href={`/product/${product.slug}`} className="cart__thumb">
                    <Media silhouette={product.silhouette} tone={product.tone} label={product.name} />
                  </Link>
                  <div className="cart__detail">
                    <div className="cart__row">
                      <h2 className="cart__name">
                        <Link href={`/product/${product.slug}`}>{product.name}</Link>
                      </h2>
                      <p className="cart__price">{formatPrice(product.price * line.qty)}</p>
                    </div>
                    <p className="cart__meta">
                      {product.colorway} · Size {line.size}
                    </p>
                    <div className="cart__controls">
                      <div className="qty" role="group" aria-label={`Quantity for ${product.name}`}>
                        <button type="button" onClick={() => setQty(line.slug, line.size, line.qty - 1)} aria-label="Decrease quantity">
                          −
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => setQty(line.slug, line.size, line.qty + 1)} aria-label="Increase quantity">
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart__remove"
                        onClick={() => remove(line.slug, line.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart__summary">
            <h2 className="cart__summary-title">Summary</h2>
            <div className="cart__sum-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="cart__sum-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</span>
            </div>
            {remaining > 0 ? (
              <p className="cart__hint">
                Add {formatPrice(remaining)} more for complimentary shipping.
              </p>
            ) : null}
            <div className="cart__sum-row cart__sum-row--total">
              <span>Total</span>
              <span>{formatPrice(subtotal + shipping)}</span>
            </div>
            <button
              type="button"
              className="btn btn--solid btn--block"
              onClick={() => setNotice('Checkout is not connected to a payment provider yet.')}
            >
              Checkout
            </button>
            {notice ? <p className="cart__notice">{notice}</p> : null}
            <Link href="/shop" className="link-underline cart__continue">
              Continue shopping
            </Link>
            <ul className="cart__assurances">
              <li>Secure checkout</li>
              <li>14-day returns</li>
              <li>Ships from Lahore</li>
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
