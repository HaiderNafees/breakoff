import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import OrderCard from '@/components/OrderCard';
import ProductCard from '@/components/ProductCard';
import Seo from '@/components/Seo';
import { formatPrice, getProduct, products } from '@/data';
import { displayName, useAccount, type Address } from '@/lib/account';
import { useWishlist } from '@/lib/wishlist';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'details', label: 'Account details' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const emptyAddress = (): Address => ({
  id: '',
  label: 'Home',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: 'Punjab',
  postal: '',
});

export default function AccountDashboard() {
  const { user, ready, signOut, updateProfile, saveAddress, removeAddress } = useAccount();
  const wishlist = useWishlist();
  const router = useRouter();
  const [addr, setAddr] = useState<Address>(emptyAddress());
  const [addrMessage, setAddrMessage] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [nameMessage, setNameMessage] = useState('');

  const requested = typeof router.query.tab === 'string' ? router.query.tab : 'overview';
  const tab: TabKey = TABS.some((item) => item.key === requested)
    ? (requested as TabKey)
    : 'overview';

  useEffect(() => {
    if (user) setNameDraft(user.name);
  }, [user]);

  const saved = useMemo(
    () => wishlist.slugs.map((slug) => getProduct(slug)).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [wishlist.slugs]
  );

  if (!ready) {
    return (
      <div className="auth-gate">
        <p className="eyebrow">Your account</p>
        <p className="empty__body">Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Seo title="Your account" description="Sign in to your BreakOff account." path="/account" />
        <div className="auth-gate">
          <p className="eyebrow">Your account</p>
          <h1 className="page-title">Sign in to continue.</h1>
          <p className="empty__body">
            Your orders, saved pieces and delivery details live behind a sign-in.
          </p>
          <div className="auth-gate__actions">
            <Link href="/account/login" className="btn btn--solid">
              Sign in
            </Link>
            <Link href="/account/signup" className="btn btn--outline">
              Create account
            </Link>
          </div>
        </div>
      </>
    );
  }

  const latest = user.orders[0];

  function submitAddress(event: FormEvent) {
    event.preventDefault();
    if (!addr.name || !addr.line1 || !addr.city || !addr.phone) {
      setAddrMessage('Name, phone, address and city are required.');
      return;
    }
    const result = saveAddress({ ...addr, id: addr.id || `a_${Date.now().toString(36)}` });
    setAddrMessage(result.error ?? 'Address saved.');
    if (!result.error) setAddr(emptyAddress());
  }

  function submitName(event: FormEvent) {
    event.preventDefault();
    const result = updateProfile({ name: nameDraft });
    setNameMessage(result.error ?? 'Name updated.');
  }

  function editAddress(address: Address) {
    setAddr(address);
    setAddrMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <Seo title="Your account" description="Your BreakOff orders, wishlist and details." path="/account" />

      <header className="page-head page-head--tight">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Account</span>
        </nav>
        <h1 className="page-title">Hello, {displayName(user)}.</h1>
        <p className="page-sub">
          Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </p>
      </header>

      <div className="dash">
        <aside className="dash__side">
          <nav className="dash__nav" aria-label="Account sections">
            {TABS.map((item) => {
              const count =
                item.key === 'orders'
                  ? user.orders.length
                  : item.key === 'wishlist'
                    ? saved.length
                    : item.key === 'addresses'
                      ? user.addresses.length
                      : null;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={tab === item.key ? 'dash__link is-active' : 'dash__link'}
                  onClick={() => router.push(`/account?tab=${item.key}`, undefined, { shallow: true })}
                  aria-current={tab === item.key ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {count !== null ? <span className="dash__count">{count}</span> : null}
                </button>
              );
            })}
          </nav>
          <div className="dash__side-foot">
            <p className="dash__email">{user.email}</p>
            <button type="button" className="dash__signout" onClick={() => { signOut(); router.push('/'); }}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="dash__panel">
          {tab === 'overview' ? (
            <>
              <div className="stats">
                <div className="stat">
                  <span className="stat__value">{user.orders.length}</span>
                  <span className="stat__label">Orders</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{saved.length}</span>
                  <span className="stat__label">Saved pieces</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{user.addresses.length}</span>
                  <span className="stat__label">Addresses</span>
                </div>
              </div>

              <section className="dash__block">
                <div className="dash__block-head">
                  <h2 className="dash__title">Latest order</h2>
                  {user.orders.length > 1 ? (
                    <button
                      type="button"
                      className="link-underline link-underline--sm"
                      onClick={() => router.push('/account?tab=orders', undefined, { shallow: true })}
                    >
                      All orders
                    </button>
                  ) : null}
                </div>
                {latest ? (
                  <OrderCard order={latest} />
                ) : (
                  <div className="mini-empty">
                    <p className="empty__title">No orders yet.</p>
                    <p className="empty__body">When you place an order it will be tracked here.</p>
                    <Link href="/shop" className="btn btn--solid">
                      Shop the collection
                    </Link>
                  </div>
                )}
              </section>

              <section className="dash__block">
                <div className="dash__block-head">
                  <h2 className="dash__title">Saved for later</h2>
                  <Link href="/wishlist" className="link-underline link-underline--sm">
                    Open wishlist
                  </Link>
                </div>
                {saved.length === 0 ? (
                  <div className="mini-empty">
                    <p className="empty__body">
                      Tap the heart on any piece to keep it here. Saving does not reserve stock.
                    </p>
                    <Link href="/shop?sort=new" className="btn btn--outline">
                      See what is new
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid--four">
                    {saved.slice(0, 4).map((product) => (
                      <ProductCard key={product.slug} product={product} />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}

          {tab === 'orders' ? (
            <section className="dash__block">
              <div className="dash__block-head">
                <h2 className="dash__title">Orders</h2>
                <p className="dash__meta">{user.orders.length} total</p>
              </div>
              {user.orders.length === 0 ? (
                <div className="mini-empty">
                  <p className="empty__title">Nothing on its way yet.</p>
                  <p className="empty__body">Your confirmed orders will appear here with their status.</p>
                  <Link href="/shop" className="btn btn--solid">
                    Start with the collection
                  </Link>
                </div>
              ) : (
                <div className="order-list">
                  {user.orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === 'wishlist' ? (
            <section className="dash__block">
              <div className="dash__block-head">
                <h2 className="dash__title">Wishlist</h2>
                {saved.length > 0 ? (
                  <button type="button" className="link-underline link-underline--sm" onClick={wishlist.clear}>
                    Clear all
                  </button>
                ) : null}
              </div>
              {saved.length === 0 ? (
                <div className="mini-empty">
                  <p className="empty__title">No saved pieces.</p>
                  <p className="empty__body">Use the heart on a product to keep it for later.</p>
                  <Link href="/shop" className="btn btn--solid">
                    Browse the collection
                  </Link>
                </div>
              ) : (
                <div className="grid grid--three">
                  {saved.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === 'addresses' ? (
            <>
              <section className="dash__block">
                <div className="dash__block-head">
                  <h2 className="dash__title">Saved addresses</h2>
                  <p className="dash__meta">{user.addresses.length} saved</p>
                </div>
                {user.addresses.length === 0 ? (
                  <p className="empty__body">
                    No addresses yet. Add one below and it will be offered at checkout.
                  </p>
                ) : (
                  <div className="address-list">
                    {user.addresses.map((address) => (
                      <article key={address.id} className="address">
                        <div className="address__head">
                          <p className="address__label">{address.label}</p>
                          <button type="button" className="address__edit" onClick={() => editAddress(address)}>
                            Edit
                          </button>
                        </div>
                        <p className="address__name">{address.name}</p>
                        <p className="address__lines">
                          {address.line1}
                          {address.line2 ? <>, {address.line2}</> : null}
                          <br />
                          {address.city}, {address.province} {address.postal}
                          <br />
                          {address.phone}
                        </p>
                        <button
                          type="button"
                          className="address__remove"
                          onClick={() => removeAddress(address.id)}
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="dash__block">
                <h2 className="dash__title">{addr.id ? 'Edit address' : 'Add an address'}</h2>
                <form className="form form--grid" onSubmit={submitAddress} noValidate>
                  <div className="field">
                    <label htmlFor="label">Label</label>
                    <input
                      id="label"
                      value={addr.label}
                      onChange={(event) => setAddr({ ...addr, label: event.target.value })}
                      placeholder="Home"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="addr-name">Full name</label>
                    <input
                      id="addr-name"
                      value={addr.name}
                      onChange={(event) => setAddr({ ...addr, name: event.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      value={addr.phone}
                      onChange={(event) => setAddr({ ...addr, phone: event.target.value })}
                      placeholder="03XX XXXXXXX"
                      inputMode="tel"
                      required
                    />
                  </div>
                  <div className="field field--wide">
                    <label htmlFor="line1">Address</label>
                    <input
                      id="line1"
                      value={addr.line1}
                      onChange={(event) => setAddr({ ...addr, line1: event.target.value })}
                      placeholder="House, street, area"
                      required
                    />
                  </div>
                  <div className="field field--wide">
                    <label htmlFor="line2">Apartment, landmark (optional)</label>
                    <input
                      id="line2"
                      value={addr.line2}
                      onChange={(event) => setAddr({ ...addr, line2: event.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      value={addr.city}
                      onChange={(event) => setAddr({ ...addr, city: event.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="province">Province</label>
                    <select
                      id="province"
                      value={addr.province}
                      onChange={(event) => setAddr({ ...addr, province: event.target.value })}
                    >
                      {['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad'].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="postal">Postal code</label>
                    <input
                      id="postal"
                      value={addr.postal}
                      onChange={(event) => setAddr({ ...addr, postal: event.target.value })}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="form__actions">
                    <button type="submit" className="btn btn--solid">
                      Save address
                    </button>
                    {addr.id ? (
                      <button type="button" className="btn btn--outline" onClick={() => setAddr(emptyAddress())}>
                        Cancel
                      </button>
                    ) : null}
                  </div>
                  {addrMessage ? <p className="form__hint">{addrMessage}</p> : null}
                </form>
              </section>
            </>
          ) : null}

          {tab === 'details' ? (
            <section className="dash__block">
              <h2 className="dash__title">Account details</h2>
              <form className="form" onSubmit={submitName}>
                <div className="field">
                  <label htmlFor="account-name">Full name</label>
                  <input
                    id="account-name"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="account-email">Email</label>
                  <input id="account-email" value={user.email} readOnly disabled />
                  <p className="field__hint">Email cannot be changed in this preview.</p>
                </div>
                <div className="form__actions">
                  <button type="submit" className="btn btn--solid">
                    Save changes
                  </button>
                </div>
                {nameMessage ? <p className="form__hint">{nameMessage}</p> : null}
              </form>

              <div className="dash__split">
                <div>
                  <h3 className="dash__subtitle">Sign out</h3>
                  <p className="dash__meta">You will need your email and password to return.</p>
                </div>
                <button type="button" className="btn btn--outline" onClick={signOut}>
                  Sign out
                </button>
              </div>

              <div className="dash__split">
                <div>
                  <h3 className="dash__subtitle">Suggested for you</h3>
                  <p className="dash__meta">
                    {formatPrice(products[0].price)} and up · free shipping over PKR 10,000
                  </p>
                </div>
                <Link href="/shop?sort=new" className="btn btn--solid">
                  New arrivals
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
