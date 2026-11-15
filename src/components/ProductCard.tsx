import Link from 'next/link';
import { useState } from 'react';
import Media from '@/components/Media';
import { formatPrice, type Product } from '@/data';
import { useCart } from '@/lib/cart';

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  function quickAdd(size: string) {
    add(product.slug, size);
    setAdded(size);
    window.setTimeout(() => setAdded(null), 1200);
  }

  return (
    <article className="card">
      <Link href={`/product/${product.slug}`} className="card__media" aria-label={product.name}>
        <Media
          silhouette={product.silhouette}
          tone={product.tone}
          className="card__art"
          label={product.name}
        />
        <Media
          silhouette={product.silhouette}
          tone={product.tone === 'dark' ? 'light' : 'dark'}
          className="card__art card__art--alt"
          label={`${product.name} alternate view`}
        />
        {product.badge ? <span className="card__badge">{product.badge}</span> : null}
        {priority ? <span className="sr-only">Featured</span> : null}
      </Link>

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
