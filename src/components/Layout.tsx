import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useCart } from '@/lib/cart';

const NAV = [
  { href: '/shop?sort=new', label: 'New In' },
  { href: '/shop?category=women', label: 'Women' },
  { href: '/shop?category=men', label: 'Men' },
  { href: '/shop?category=accessories', label: 'Accessories' },
  { href: '/shop?category=essentials', label: 'Essentials' },
  { href: '/about', label: 'Studio' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { count, ready } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function subscribe(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSignedUp(true);
    setEmail('');
  }

  return (
    <div className="site">
      <div className="announce">
        <div className="announce__track">
          <span>Complimentary shipping over PKR 10,000</span>
          <span aria-hidden="true">/</span>
          <span>Free returns within 14 days</span>
          <span aria-hidden="true">/</span>
          <span>Autumn / Winter 26 — now live</span>
        </div>
      </div>

      <header className="header">
        <div className="header__inner">
          <button
            type="button"
            className="header__icon header__menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Menu"
          >
            <span className={menuOpen ? 'burger is-open' : 'burger'} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>

          <Link href="/" className="brand" aria-label="BreakOff home">
            <svg viewBox="0 0 32 32" className="brand__mark" aria-hidden="true">
              <path
                d="M2 16h4l3-6l3 12l4-8 3 5h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="brand__word">BreakOff</span>
          </Link>

          <nav className="nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} className="nav__link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            <form className="search" action="/shop" method="get" role="search">
              <input
                className="search__input"
                type="search"
                name="q"
                placeholder="Search"
                aria-label="Search products"
              />
              <button className="search__submit" type="submit" aria-label="Submit search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </form>

            <Link href="/cart" className="header__icon header__bag" aria-label={`Bag, ${count} items`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 8h14l-1.2 12.2H6.2Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8V6.5a3 3 0 0 1 6 0V8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <span className="header__count" aria-hidden="true">
                {ready ? count : 0}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={menuOpen ? 'drawer is-open' : 'drawer'} hidden={!menuOpen}>
        <nav className="drawer__nav" aria-label="Mobile">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="drawer__link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="drawer__foot">
          <Link href="/care" className="drawer__small">
            Customer care
          </Link>
          <Link href="/stores" className="drawer__small">
            Stores
          </Link>
        </div>
      </div>

      <main className="main">{children}</main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <p className="footer__word">BreakOff</p>
            <p className="footer__blurb">
              A single-line study in black and white. Cut, washed and finished in small runs —
              made to be worn until it shows.
            </p>
            <form className="subscribe" onSubmit={subscribe}>
              <label className="subscribe__label" htmlFor="newsletter">
                Join the list
              </label>
              <div className="subscribe__row">
                <input
                  id="newsletter"
                  className="subscribe__input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  aria-label="Email address"
                />
                <button className="subscribe__button" type="submit">
                  {signedUp ? 'Added' : 'Sign up'}
                </button>
              </div>
              <p className="subscribe__note">
                {signedUp ? 'Thank you — you are on the list.' : 'Occasional notes. No noise.'}
              </p>
            </form>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Shop</h4>
            <Link href="/shop?category=women">Women</Link>
            <Link href="/shop?category=men">Men</Link>
            <Link href="/shop?category=accessories">Accessories</Link>
            <Link href="/shop?sort=new">New in</Link>
            <Link href="/shop?sort=sale">Sale</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Help</h4>
            <Link href="/care">Shipping</Link>
            <Link href="/care#returns">Returns</Link>
            <Link href="/care#sizing">Size guide</Link>
            <Link href="/care#faq">FAQ</Link>
            <Link href="/stores">Stores</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Studio</h4>
            <Link href="/about">About BreakOff</Link>
            <Link href="/about#materials">Materials</Link>
            <Link href="/about#making">How it is made</Link>
            <Link href="/care#contact">Contact</Link>
          </div>
        </div>

        <div className="footer__legal">
          <p>© {new Date().getFullYear()} BreakOff. All rights reserved.</p>
          <div className="footer__legal-links">
            <Link href="/care#privacy">Privacy</Link>
            <Link href="/care#terms">Terms</Link>
            <Link href="/care#returns">Returns</Link>
          </div>
          <p className="footer__made">Designed and made in Pakistan</p>
        </div>
      </footer>
    </div>
  );
}
