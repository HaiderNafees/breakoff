import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import OrderCard from '@/components/OrderCard';
import OrderTimeline from '@/components/OrderTimeline';
import Seo from '@/components/Seo';
import { formatPrice } from '@/data';
import { useAccount } from '@/lib/account';
import { useCart } from '@/lib/cart';
import type { Order } from '@/lib/types';

type State = 'loading' | 'ready' | 'pending' | 'error';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { clear } = useCart();
  const { user, refresh } = useAccount();
  const [state, setState] = useState<State>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const sessionId = typeof router.query.session_id === 'string' ? router.query.session_id : '';
    if (!sessionId) {
      setError('This page needs the payment reference. Check your email for the confirmation.');
      setState('error');
      return;
    }

    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await response.json().catch(() => ({}))) as {
          order?: Order | null;
          pending?: boolean;
          error?: string;
        };
        if (!active) return;
        if (!response.ok) {
          setError(data.error ?? 'We could not confirm that payment.');
          setState('error');
          return;
        }
        if (data.pending || !data.order) {
          setState('pending');
          return;
        }
        setOrder(data.order);
        setState('ready');
        clear();
        void refresh();
      } catch {
        if (!active) return;
        setError('We could not reach the server to confirm the payment.');
        setState('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [router.isReady, router.query.session_id, clear, refresh]);

  return (
    <>
      <Seo title="Order confirmed" description="Thank you for your order." path="/checkout/success" />

      <div className="checkout-done">
        {state === 'loading' ? (
          <div className="checkout-done__head">
            <p className="eyebrow">Payment</p>
            <h1 className="page-title">Confirming your payment…</h1>
            <p className="page-sub">One moment while Stripe tells us the payment cleared.</p>
          </div>
        ) : null}

        {state === 'pending' ? (
          <div className="checkout-done__head">
            <p className="eyebrow">Payment</p>
            <h1 className="page-title">Payment is still clearing.</h1>
            <p className="page-sub">
              Some banks take a few minutes. Your order is saved — refresh this page shortly, or
              track it from your account.
            </p>
            <div className="checkout-done__actions">
              <Link href="/account?tab=orders" className="btn btn--solid">
                Your orders
              </Link>
            </div>
          </div>
        ) : null}

        {state === 'error' ? (
          <div className="checkout-done__head">
            <p className="eyebrow">Payment</p>
            <h1 className="page-title">We could not confirm that payment.</h1>
            <p className="page-sub">{error}</p>
            <div className="checkout-done__actions">
              <Link href="/track" className="btn btn--solid">
                Track an order
              </Link>
              <Link href="/care#contact" className="btn btn--outline">
                Contact the studio
              </Link>
            </div>
          </div>
        ) : null}

        {state === 'ready' && order ? (
          <>
            <div className="checkout-done__head">
              <span className="checkout-done__tick" aria-hidden="true">
                ✓
              </span>
              <p className="eyebrow">Order {order.id}</p>
              <h1 className="page-title">Thank you, {order.address.name.split(' ')[0]}.</h1>
              <p className="page-sub">
                Payment of {formatPrice(order.total)} received. A confirmation is on its way to{' '}
                {order.email}. We dispatch from Lahore within 48 hours.
              </p>
            </div>

            <div className="checkout-done__body">
              <OrderCard order={order} />
              <aside className="checkout-done__side">
                <h2 className="dash__title">Tracking</h2>
                <OrderTimeline order={order} />
                <div className="checkout-done__actions">
                  <Link href={`/track?number=${order.id}`} className="btn btn--solid btn--block">
                    Track this order
                  </Link>
                  {user ? (
                    <Link href="/account?tab=orders" className="btn btn--outline btn--block">
                      View in your account
                    </Link>
                  ) : (
                    <Link href="/account/signup" className="btn btn--outline btn--block">
                      Create an account to keep it
                    </Link>
                  )}
                  <Link href="/shop" className="link-underline link-underline--sm">
                    Continue shopping
                  </Link>
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
