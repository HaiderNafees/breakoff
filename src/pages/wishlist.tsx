import Link from 'next/link';
import { useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import Seo from '@/components/Seo';
import { getProduct, type Product } from '@/data';
import { useAccount } from '@/lib/account';
import { useWishlist } from '@/lib/wishlist';

export default function WishlistPage() {
  const wishlist = useWishlist();
  const { user, ready } = useAccount();

  const saved = useMemo(
    () =>
      wishlist.slugs
        .map((slug) => getProduct(slug))
        .filter((item): item is Product => Boolean(item)),
    [wishlist.slugs]
  );

  return (
    <>
      <Seo
        title="Wishlist"
        description="Pieces you have saved from the BreakOff collection."
        path="/wishlist"
      />

      <header className="page-head page-head--tight">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Wishlist</span>
        </nav>
        <h1 className="page-title">Saved pieces</h1>
        <p className="page-sub">
          {wishlist.ready ? `${saved.length} ${saved.length === 1 ? 'piece' : 'pieces'} saved` : 'Loading'}
        </p>
      </header>

      <div className="wishlist">
        {!wishlist.ready ? (
          <p className="empty__body">Loading your wishlist…</p>
        ) : saved.length === 0 ? (
          <div className="mini-empty">
            <p className="empty__title">Nothing saved yet.</p>
            <p className="empty__body">
              Tap the heart on any piece and it will wait here until you are ready.
            </p>
            <Link href="/shop" className="btn btn--solid">
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist__bar">
              <p className="dash__meta">Saving a piece does not reserve stock.</p>
              <button type="button" className="link-underline link-underline--sm" onClick={wishlist.clear}>
                Clear wishlist
              </button>
            </div>
            <div className="grid grid--four">
              {saved.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
            <div className="wishlist__foot">
              {ready && user ? (
                <Link href="/account?tab=wishlist" className="btn btn--outline">
                  Manage in your account
                </Link>
              ) : (
                <>
                  <p className="empty__body">Sign in to keep this list across visits.</p>
                  <Link href="/account/login?next=/wishlist" className="btn btn--outline">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
