import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import OrderCard from '@/components/OrderCard';
import OrderTimeline from '@/components/OrderTimeline';
import Seo from '@/components/Seo';
import { useAccount } from '@/lib/account';
import type { Order } from '@/lib/types';

export default function TrackPage() {
  const router = useRouter();
  const { user, ready } = useAccount();
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async (reference: string, address: string) => {
    setBusy(true);
    setError('');
    setOrder(null);
    const params = new URLSearchParams({ number: reference });
    if (address.trim()) params.set('email', address.trim());
    try {
      const response = await fetch(`/api/track?${params.toString()}`);
      const data = (await response.json().catch(() => ({}))) as { order?: Order; error?: string };
      if (!response.ok || !data.order) {
        setError(data.error ?? 'We could not find that order.');
        return;
      }
      setOrder(data.order);
    } catch {
      setError('We could not reach the server. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }, []);

  // Signed-in customers can follow an order with only its number.
  useEffect(() => {
    if (!ready) return;
    const reference = typeof router.query.number === 'string' ? router.query.number : '';
    if (!reference) return;
    setNumber(reference);
    const queryEmail = typeof router.query.email === 'string' ? router.query.email : '';
    if (queryEmail) setEmail(queryEmail);
    // A guest arriving with only a number still gets a useful prompt.
    void lookup(reference, queryEmail || user?.email || '');
  }, [ready, router.query.number, router.query.email, user, lookup]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!number.trim()) {
      setError('Enter the order number from your confirmation.');
      return;
    }
    void lookup(number, email || user?.email || '');
  }

  return (
    <>
      <Seo
        title="Track an order"
        description="Follow a BreakOff order from the studio in Lahore to your door."
        path="/track"
      />

      <header className="page-head page-head--tight">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Track</span>
        </nav>
        <h1 className="page-title">Where is it?</h1>
        <p className="page-sub">
          Enter your order number and the email you ordered with. Signed-in customers only need the
          number.
        </p>
      </header>

      <div className="track">
        <form className="form form--grid track__form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="order-number">Order number</label>
            <input
              id="order-number"
              value={number}
              onChange={(event) => setNumber(event.target.value.toUpperCase())}
              placeholder="BO-XXXXXX"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="field">
            <label htmlFor="order-email">Email</label>
            <input
              id="order-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={user ? user.email : 'you@example.com'}
              autoComplete="email"
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--solid" disabled={busy}>
              {busy ? 'Looking…' : 'Track order'}
            </button>
            {user ? (
              <Link href="/account?tab=orders" className="link-underline link-underline--sm">
                See all your orders
              </Link>
            ) : null}
          </div>
          {error ? (
            <p className="form__error" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        {order ? (
          <section className="track__result">
            <div className="track__head">
              <p className="eyebrow">Order {order.id}</p>
              <h2 className="dash__title">
                {order.status === 'delivered'
                  ? 'Delivered.'
                  : order.status === 'cancelled'
                    ? 'Cancelled.'
                    : 'On its way.'}
              </h2>
              <p className="page-sub">
                {order.trackingNumber
                  ? `${order.carrier ?? 'BreakOff Courier'} · ${order.trackingNumber}`
                  : 'A tracking number appears here once the parcel is dispatched.'}
              </p>
            </div>

            <div className="track__body">
              <OrderTimeline order={order} />
              <OrderCard order={order} />
            </div>

            <div className="track__foot">
              <p className="dash__meta">
                Sent to {order.email} · {order.address.city}
              </p>
              <Link href="/care#returns" className="link-underline link-underline--sm">
                Returns and exchanges
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
