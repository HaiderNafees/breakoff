import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import OrderCard from '@/components/OrderCard';
import OrderTimeline from '@/components/OrderTimeline';
import Photo from '@/components/Photo';
import Seo from '@/components/Seo';
import { formatPrice, getProduct } from '@/data';
import { useAccount } from '@/lib/account';
import { FREE_SHIPPING_THRESHOLD, useCart } from '@/lib/cart';
import { DELIVERY_FEE, shippingFor } from '@/lib/shipping';
import type { DeliveryMethod, Order, PaymentMethod } from '@/lib/types';

const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad'];
const LAST_ORDER_KEY = 'breakoff:last-order:v1';

type CheckoutProps = { stripeEnabled: boolean };

/** Lets the page say whether real card payments are live, without shipping a secret to the browser. */
export async function getServerSideProps() {
  return { props: { stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY) } };
}

export default function CheckoutPage({ stripeEnabled }: CheckoutProps) {
  const { lines, subtotal, clear, ready } = useCart();
  const { user, refresh } = useAccount();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [postal, setPostal] = useState('');
  const [delivery, setDelivery] = useState<DeliveryMethod>('standard');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const cancelled = router.query.payment === 'cancelled';

  // Prefill from the signed-in account
  useEffect(() => {
    if (!user) return;
    setEmail((current) => current || user.email);
    const name = user.name.trim().split(/\s+/);
    setFirstName((current) => current || name[0] || '');
    setLastName((current) => current || name.slice(1).join(' '));
    const address = user.addresses[0];
    if (address) {
      setPhone((current) => current || address.phone);
      setLine1((current) => current || address.line1);
      setLine2((current) => current || address.line2 || '');
      setCity((current) => current || address.city);
      setProvince((current) => (current === 'Punjab' ? address.province : current));
      setPostal((current) => current || address.postal);
    }
  }, [user]);

  // Restore the confirmation if this session already completed an order
  useEffect(() => {
    if (!ready || lines.length > 0) return;
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) setPlaced(JSON.parse(raw) as Order);
    } catch {
      // ignore
    }
  }, [ready, lines.length]);

  const shipping = shippingFor(subtotal, delivery);
  const total = subtotal + shipping;

  const summaryLines = useMemo(
    () =>
      lines.map((line) => {
        const product = getProduct(line.slug);
        return { ...line, product };
      }),
    [lines]
  );

  function collectInformation(found: Record<string, string>) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) found.email = 'Enter a valid email.';
    if (!firstName.trim()) found.firstName = 'Required.';
    if (!lastName.trim()) found.lastName = 'Required.';
    if (phone.replace(/\D/g, '').length < 10) found.phone = 'Enter a valid phone number.';
    if (!line1.trim()) found.line1 = 'Required.';
    if (!city.trim()) found.city = 'Required.';
    if (!province.trim()) found.province = 'Required.';
    if (postal && !/^\d{4,6}$/.test(postal)) found.postal = 'Use 4–6 digits.';
  }

  function collectPayment(found: Record<string, string>) {
    if (payment !== 'card') return;
    if (cardNumber.replace(/\s/g, '').length !== 16) found.cardNumber = 'Enter the 16-digit card number.';
    if (!cardName.trim()) found.cardName = 'Required.';
    if (!/^\s*\d{2}\s*\/\s*\d{2}\s*$/.test(expiry)) found.expiry = 'Use MM / YY.';
    else {
      const [mm, yy] = expiry.split('/').map((part) => parseInt(part.trim(), 10));
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (mm < 1 || mm > 12) found.expiry = 'Invalid month.';
      else if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        found.expiry = 'Card has expired.';
      }
    }
    if (!/^\d{3,4}$/.test(cvc)) found.cvc = '3–4 digits.';
  }

  /** Step 1 is the only step with fields that must be settled before moving on. */
  function validateStepInformation(): boolean {
    const found: Record<string, string> = {};
    collectInformation(found);
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function advance(event: FormEvent) {
    event.preventDefault();
    if (step === 1 && !validateStepInformation()) return;
    if (step === 2) setStep(3);
    else if (step === 1) setStep(2);
  }

  async function placeOrder() {
    if (placing) return;
    setOrderError('');
    const found: Record<string, string> = {};
    // With Stripe the card fields are not ours and live on Stripe's page.
    if (!stripeEnabled) collectPayment(found);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPlacing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          line1,
          line2,
          city,
          province,
          postal,
          delivery,
          payment,
          lines: lines.map((line) => ({ slug: line.slug, size: line.size, qty: line.qty })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        order?: Order;
        checkoutUrl?: string | null;
        error?: string;
      };
      if (!response.ok || !data.order) {
        setOrderError(data.error ?? 'We could not place that order. Please try again.');
        return;
      }
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      try {
        window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data.order));
      } catch {
        // ignore
      }
      setPlaced(data.order);
      clear();
      await refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setOrderError('We could not reach the server, so nothing was charged. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <>
        <Seo title="Order confirmed" description="Thank you for your order." path="/checkout" />
        <div className="checkout-done">
          <div className="checkout-done__head">
            <span className="checkout-done__tick" aria-hidden="true">
              ✓
            </span>
            <p className="eyebrow">Order {placed.id}</p>
            <h1 className="page-title">Thank you, {placed.address.name.split(' ')[0]}.</h1>
            <p className="page-sub">
              A confirmation has been prepared for {placed.email}. We dispatch from Lahore within 48 hours.
            </p>
          </div>

          <div className="checkout-done__body">
            <OrderCard order={placed} />
            <aside className="checkout-done__side">
              <h2 className="dash__title">Tracking</h2>
              <OrderTimeline order={placed} />
              <p className="checkout__demo">
                {placed.paymentStatus === 'paid'
                  ? 'Payment received. A receipt has been prepared for your email.'
                  : placed.payment === 'cod'
                    ? `Pay ${formatPrice(placed.total)} to the courier when your parcel arrives.`
                    : 'Demo checkout — no payment provider is connected, so no card was charged.'}
              </p>
              <div className="checkout-done__actions">
                <Link href={`/track?number=${placed.id}`} className="btn btn--solid btn--block">
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
        </div>
      </>
    );
  }

  if (!ready) {
    return (
      <div className="checkout">
        <p className="empty__body">Preparing checkout…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        <Seo title="Checkout" description="Checkout with BreakOff." path="/checkout" />
        <div className="cart cart--empty">
          <p className="empty__title">Nothing to check out yet.</p>
          <p className="empty__body">Add a piece to your bag and return here.</p>
          <Link href="/shop" className="btn btn--solid">
            Shop all pieces
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Checkout" description="Complete your BreakOff order." path="/checkout" />

      <header className="page-head page-head--tight">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/cart">Bag</Link>
          <span aria-hidden="true">/</span>
          <span>Checkout</span>
        </nav>
        <h1 className="page-title">Checkout</h1>
        <p className="page-sub">A short, three-step finish. You can review everything before placing the order.</p>
      </header>

      <div className="checkout">
        <div className="checkout__main">
          <ol className="checkout__steps">
            {[
              { n: 1, label: 'Information' },
              { n: 2, label: 'Delivery' },
              { n: 3, label: 'Payment' },
            ].map((item) => (
              <li
                key={item.n}
                className={`checkout__step${step === item.n ? ' is-active' : ''}${step > item.n ? ' is-done' : ''}`}
              >
                <span className="checkout__step-n">{step > item.n ? '✓' : item.n}</span>
                {item.label}
              </li>
            ))}
          </ol>

          {cancelled ? (
            <p className="form__error" role="alert">
              Payment was cancelled and nothing was charged. Your bag is still here.
            </p>
          ) : null}

          <p className="checkout__demo">
            {stripeEnabled
              ? 'Card payments are collected on Stripe’s secure page. We never see your card details.'
              : 'Demo checkout — no payment provider is connected yet, so no card is charged.'}
          </p>

          {step === 1 ? (
            <form className="form form--grid" onSubmit={advance} noValidate>
              <div className="form__section-title">Contact</div>
              <div className="field field--wide">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? <p className="field__error">{errors.email}</p> : null}
              </div>

              <div className="form__section-title">Shipping address</div>
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName)}
                />
                {errors.firstName ? <p className="field__error">{errors.firstName}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.lastName)}
                />
                {errors.lastName ? <p className="field__error">{errors.lastName}</p> : null}
              </div>
              <div className="field field--wide">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  placeholder="03XX XXXXXXX"
                  inputMode="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone ? <p className="field__error">{errors.phone}</p> : null}
              </div>
              <div className="field field--wide">
                <label htmlFor="line1">Address</label>
                <input
                  id="line1"
                  value={line1}
                  onChange={(event) => setLine1(event.target.value)}
                  autoComplete="address-line1"
                  placeholder="House, street, area"
                  aria-invalid={Boolean(errors.line1)}
                />
                {errors.line1 ? <p className="field__error">{errors.line1}</p> : null}
              </div>
              <div className="field field--wide">
                <label htmlFor="line2">Apartment, landmark (optional)</label>
                <input
                  id="line2"
                  value={line2}
                  onChange={(event) => setLine2(event.target.value)}
                  autoComplete="address-line2"
                />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.city)}
                />
                {errors.city ? <p className="field__error">{errors.city}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="province">Province</label>
                <select id="province" value={province} onChange={(event) => setProvince(event.target.value)}>
                  {PROVINCES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="postal">Postal code</label>
                <input
                  id="postal"
                  value={postal}
                  onChange={(event) => setPostal(event.target.value)}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.postal)}
                />
                {errors.postal ? <p className="field__error">{errors.postal}</p> : null}
              </div>

              <div className="form__actions form__actions--wide">
                <button type="submit" className="btn btn--solid">
                  Continue to delivery
                </button>
                <Link href="/cart" className="link-underline link-underline--sm">
                  Return to bag
                </Link>
              </div>
            </form>
          ) : null}

          {step === 2 ? (
            <form className="form" onSubmit={advance}>
              <div className="form__section-title">Delivery method</div>
              <div className="options">
                <label className={`option${delivery === 'standard' ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="standard"
                    checked={delivery === 'standard'}
                    onChange={() => setDelivery('standard')}
                  />
                  <span className="option__body">
                    <span className="option__title">Standard</span>
                    <span className="option__meta">2–4 working days · dispatched from Lahore</span>
                  </span>
                  <span className="option__price">
                    {subtotal >= FREE_SHIPPING_THRESHOLD ? 'Complimentary' : formatPrice(DELIVERY_FEE.standard)}
                  </span>
                </label>
                <label className={`option${delivery === 'express' ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="express"
                    checked={delivery === 'express'}
                    onChange={() => setDelivery('express')}
                  />
                  <span className="option__body">
                    <span className="option__title">Express</span>
                    <span className="option__meta">1–2 working days · signature required</span>
                  </span>
                  <span className="option__price">{formatPrice(DELIVERY_FEE.express)}</span>
                </label>
              </div>

              <div className="form__section-title">Shipping to</div>
              <div className="review">
                <p className="review__name">
                  {firstName} {lastName} · {phone}
                </p>
                <p className="review__address">
                  {line1}
                  {line2 ? `, ${line2}` : ''}
                  <br />
                  {city}, {province} {postal}
                  <br />
                  {email}
                </p>
                <button type="button" className="link-underline link-underline--sm" onClick={() => setStep(1)}>
                  Edit details
                </button>
              </div>

              <div className="form__actions">
                <button type="submit" className="btn btn--solid">
                  Continue to payment
                </button>
                <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>
                  Back
                </button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                placeOrder();
              }}
            >
              <div className="form__section-title">Payment</div>
              <div className="options">
                <label className={`option${payment === 'card' ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={payment === 'card'}
                    onChange={() => setPayment('card')}
                  />
                  <span className="option__body">
                    <span className="option__title">Card</span>
                    <span className="option__meta">Visa, Mastercard, UnionPay</span>
                  </span>
                </label>
                <label className={`option${payment === 'cod' ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={payment === 'cod'}
                    onChange={() => setPayment('cod')}
                  />
                  <span className="option__body">
                    <span className="option__title">Cash on delivery</span>
                    <span className="option__meta">Pay the courier · Pakistan only</span>
                  </span>
                </label>
              </div>

              {payment === 'card' && stripeEnabled ? (
                <p className="review__address">
                  You will be taken to Stripe to enter your card details, then returned here with a
                  confirmation. Nothing is charged until you approve it there.
                </p>
              ) : null}

              {payment === 'card' && !stripeEnabled ? (
                <div className="card-form">
                  <div className="field">
                    <label htmlFor="cardNumber">Card number</label>
                    <input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(event) =>
                        setCardNumber(
                          event.target.value
                            .replace(/\D/g, '')
                            .slice(0, 16)
                            .replace(/(.{4})/g, '$1 ')
                            .trim()
                        )
                      }
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      aria-invalid={Boolean(errors.cardNumber)}
                    />
                    {errors.cardNumber ? <p className="field__error">{errors.cardNumber}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor="cardName">Name on card</label>
                    <input
                      id="cardName"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                      autoComplete="cc-name"
                      aria-invalid={Boolean(errors.cardName)}
                    />
                    {errors.cardName ? <p className="field__error">{errors.cardName}</p> : null}
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="expiry">Expiry</label>
                      <input
                        id="expiry"
                        value={expiry}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
                          setExpiry(digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits);
                        }}
                        placeholder="MM / YY"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        aria-invalid={Boolean(errors.expiry)}
                      />
                      {errors.expiry ? <p className="field__error">{errors.expiry}</p> : null}
                    </div>
                    <div className="field">
                      <label htmlFor="cvc">CVC</label>
                      <input
                        id="cvc"
                        value={cvc}
                        onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        aria-invalid={Boolean(errors.cvc)}
                      />
                      {errors.cvc ? <p className="field__error">{errors.cvc}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {payment !== 'card' ? (
                <p className="review__address">
                  You will pay {formatPrice(total)} to the courier on arrival. Please keep the exact amount ready.
                </p>
              ) : null}

              {orderError ? (
                <p className="form__error" role="alert">
                  {orderError}
                </p>
              ) : null}

              <div className="form__actions">
                <button type="submit" className="btn btn--solid" disabled={placing}>
                  {placing
                    ? 'Placing your order…'
                    : stripeEnabled && payment === 'card'
                      ? `Pay with card · ${formatPrice(total)}`
                      : `Place order · ${formatPrice(total)}`}
                </button>
                <button type="button" className="btn btn--outline" onClick={() => setStep(2)}>
                  Back
                </button>
              </div>
              <p className="form__aside">
                By placing this order you agree to our{' '}
                <Link href="/care#terms" className="link-underline link-underline--sm">
                  terms
                </Link>
                . Returns accepted within 14 days.
              </p>
            </form>
          ) : null}
        </div>

        <aside className="checkout__summary">
          <h2 className="cart__summary-title">Your order</h2>
          <ul className="checkout__lines">
            {summaryLines.map((line) => (
              <li key={`${line.slug}-${line.size}`} className="checkout__line">
                <span className="checkout__thumb">
                  <Photo
                    images={line.product?.images}
                    silhouette={line.product?.silhouette ?? 'tee'}
                    tone={line.product?.tone ?? 'light'}
                    alt={line.product?.name ?? line.slug}
                    sizes="64px"
                  />
                  <span className="checkout__qty">{line.qty}</span>
                </span>
                <span className="checkout__line-body">
                  <span className="checkout__line-name">{line.product?.name ?? line.slug}</span>
                  <span className="checkout__line-meta">Size {line.size}</span>
                </span>
                <span className="checkout__line-price">
                  {formatPrice((line.product?.price ?? 0) * line.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="cart__sum-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="cart__sum-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</span>
          </div>
          <div className="cart__sum-row cart__sum-row--total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <ul className="cart__assurances">
            <li>Secure checkout</li>
            <li>14-day returns</li>
            <li>Ships from Lahore</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
