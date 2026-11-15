import Link from 'next/link';
import { useState } from 'react';
import Photo from '@/components/Photo';
import { formatPrice, type Product } from '@/data';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const [added, setAdded] = useState<string | null>(null);
  const saved = wishlist.has(product.slug);

  function quickAdd(size: string) {
    add(product.slug, size);
    setAdded(size);
    window.setTimeout(() => setAdded(null), 1200);
  }

  return (
    <article className="card">
      <Link href={`/product/${product.slug}`} className="card__media" aria-label={product.name}>
        <Photo
          images={product.images}
          index={0}
          silhouette={product.silhouette}
          tone={product.tone}
          className="card__art"
          alt={product.name}
          priority={priority}
          sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <Photo
          images={product.images}
          index={1}
          silhouette={product.silhouette}
          tone={product.tone === 'dark' ? 'light' : 'dark'}
          className="card__art card__art--alt"
          alt={`${product.name}, alternate view`}
        />
        {product.badge ? <span className="card__badge">{product.badge}</span> : null}
      </Link>

      <button
        type="button"
        className={saved ? 'card__wish is-saved' : 'card__wish'}
        onClick={() => wishlist.toggle(product.slug)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      >
        <Heart filled={saved} />
      </button>

      <div className="card__body">
        <div className="card__line">
          <h3 className="card__name">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="card__price">
            {product.compareAt ? <s>{formatPrice(product.compareAt)}</s> : null}
            {formatPrice(product.price)}
          </p>
        </div>
        <p className="card__meta">
          {product.colorway} · {product.collection}
        </p>
        <ul className="card__sizes" aria-label={`Add ${product.name} to bag`}>
          {product.sizes.slice(0, 6).map((size) => (
            <li key={size}>
              <button
                type="button"
                className={`card__size${added === size ? ' is-added' : ''}`}
                onClick={() => quickAdd(size)}
                aria-label={`Add ${product.name} size ${size} to bag`}
              >
                {added === size ? 'Added' : size}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Heart({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="heart">
      <path
        d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3C19.5 15.4 12 20 12 20Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
