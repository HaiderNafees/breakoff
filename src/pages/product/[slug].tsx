import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { useState } from 'react';
import Media from '@/components/Media';
import ProductCard from '@/components/ProductCard';
import Seo from '@/components/Seo';
import { formatPrice, getProduct, products, relatedTo, type Product } from '@/data';
import { useCart } from '@/lib/cart';

type Props = { product: Product; related: Product[] };

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: products.map((product) => ({ params: { slug: product.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const product = getProduct(String(params?.slug));
  if (!product) return { notFound: true };
  return { props: { product, related: relatedTo(product, 4) } };
};

export default function ProductPage({ product, related }: Props) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [view, setView] = useState(0);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState<string>('details');

  const alternate = product.tone === 'dark' ? 'light' : 'dark';

  function addToBag() {
    if (!size) return;
    add(product.slug, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const panels = [
    { id: 'details', title: 'Details', items: product.details },
    { id: 'fabric', title: 'Fabric & care', items: [product.fabric, ...product.care] },
    {
      id: 'shipping',
      title: 'Shipping & returns',
      items: [
        'Dispatched within 48 hours from Lahore',
        'Complimentary shipping over PKR 10,000',
        'Free returns within 14 days, unworn with tags',
        'International delivery in 5–9 working days',
      ],
    },
  ];

  return (
    <>
      <Seo
        title={product.name}
        description={product.description}
        path={`/product/${product.slug}`}
      />

      <div className="pdp">
        <nav className="crumbs crumbs--pdp" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/shop?category=${product.category}`}>{product.category}</Link>
          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="pdp__grid">
          <div className="pdp__gallery">
            <div className="pdp__stage">
              <Media
                silhouette={product.silhouette}
                tone={view === 0 ? product.tone : alternate}
                label={product.name}
              />
              {product.badge ? <span className="pdp__badge">{product.badge}</span> : null}
            </div>
            <div className="pdp__thumbs">
              {[product.tone, alternate].map((tone, index) => (
                <button
                  key={tone}
                  type="button"
                  className={`pdp__thumb${view === index ? ' is-active' : ''}`}
                  onClick={() => setView(index)}
                  aria-label={`View ${index + 1}`}
                >
                  <Media
                    silhouette={product.silhouette}
                    tone={tone as 'dark' | 'light'}
                    label={`${product.name} view ${index + 1}`}
                  />
                </button>
              ))}
              <button
                type="button"
                className={`pdp__thumb${view === 2 ? ' is-active' : ''}`}
                onClick={() => setView(2)}
                aria-label="View detail"
              >
                <Media silhouette="scarf" tone={product.tone} label={`${product.name} detail`} />
              </button>
            </div>
          </div>

          <div className="pdp__info">
            <p className="eyebrow">
              {product.collection} · {product.colorway}
            </p>
            <h1 className="pdp__title">{product.name}</h1>
            <p className="pdp__price">
              {product.compareAt ? <s>{formatPrice(product.compareAt)}</s> : null}
              {formatPrice(product.price)}
              {product.compareAt ? <span className="pdp__save">Reduced</span> : null}
            </p>
            <p className="pdp__desc">{product.description}</p>

            <div className="pdp__block">
              <div className="pdp__row">
                <span className="pdp__label">Size</span>
                <Link href="/care#sizing" className="link-underline link-underline--sm">
                  Size guide
                </Link>
              </div>
              <ul className="sizes">
                {product.sizes.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      className={`size${size === option ? ' is-active' : ''}`}
                      onClick={() => setSize(option)}
                      aria-pressed={size === option}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="btn btn--solid btn--block"
              onClick={addToBag}
              disabled={!size}
            >
              {added ? 'Added to bag' : size ? 'Add to bag' : 'Select a size'}
            </button>

            <p className="pdp__note">Free shipping over PKR 10,000 · 14-day returns</p>

            <div className="accordion">
              {panels.map((panel) => (
                <div key={panel.id} className="accordion__item">
                  <button
                    type="button"
                    className="accordion__trigger"
                    onClick={() => setOpen(open === panel.id ? '' : panel.id)}
                    aria-expanded={open === panel.id}
                  >
                    {panel.title}
                    <span aria-hidden="true">{open === panel.id ? '−' : '+'}</span>
                  </button>
                  {open === panel.id ? (
                    <ul className="accordion__body">
                      {panel.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Complete the look</h2>
          <Link href={`/shop?category=${product.category}`} className="link-underline">
            More {product.category}
          </Link>
        </div>
        <div className="grid grid--four">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </>
  );
}
