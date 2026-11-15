import Link from 'next/link';
import Media from '@/components/Media';
import ProductCard from '@/components/ProductCard';
import Seo from '@/components/Seo';
import { categories, formatPrice, products } from '@/data';

const featured = [
  ...products.filter((product) => product.badge === 'New'),
  ...products.filter((product) => product.badge !== 'New'),
].slice(0, 8);

const essentials = products
  .filter((product) => product.category === 'essentials' || product.collection === 'Essentials')
  .slice(0, 4);

export default function Home() {
  return (
    <>
      <Seo
        title="BreakOff — Timeless Clothing"
        description="BreakOff is a monochrome wardrobe of kurtas, tailoring, leather and silk. Black and white only, cut in small runs in Pakistan."
      />

      <section className="hero">
        <div className="hero__art" aria-hidden="true">
          <Media silhouette="coat" tone="dark" />
        </div>
        <div className="hero__inner">
          <p className="eyebrow eyebrow--light">Autumn / Winter 26</p>
          <h1 className="hero__title">
            Cut from
            <br />
            a single line.
          </h1>
          <p className="hero__sub">
            Black and white, nothing between. Kurtas, tailoring and leatherwear made in small runs
            and built to be worn until they show.
          </p>
          <div className="hero__cta">
            <Link href="/shop" className="btn btn--solid-light">
              Shop the collection
            </Link>
            <Link href="/about" className="btn btn--ghost-light">
              The studio
            </Link>
          </div>
          <ul className="hero__meta">
            <li>Small-run production</li>
            <li>Natural fibres</li>
            <li>Made in Pakistan</li>
          </ul>
        </div>
      </section>

      <section className="strip">
        <div className="strip__item">
          <span className="strip__num">01</span>
          <p>Complimentary shipping over PKR 10,000</p>
        </div>
        <div className="strip__item">
          <span className="strip__num">02</span>
          <p>Free returns within 14 days</p>
        </div>
        <div className="strip__item">
          <span className="strip__num">03</span>
          <p>Made in small, numbered runs</p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Shop by category</h2>
          <Link href="/shop" className="link-underline">
            View all
          </Link>
        </div>
        <div className="cats">
          {categories.map((category) => (
            <Link key={category.key} href={`/shop?category=${category.key}`} className="cat">
              <div className="cat__art">
                <Media
                  silhouette={
                    category.key === 'accessories'
                      ? 'tote'
                      : category.key === 'men'
                        ? 'shirt'
                        : category.key === 'essentials'
                          ? 'tee'
                          : 'kurta'
                  }
                  tone={category.key === 'men' || category.key === 'accessories' ? 'dark' : 'light'}
                  label={category.label}
                />
              </div>
              <div className="cat__label">
                <h3>{category.label}</h3>
                <span>{category.blurb}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">New in</h2>
          <Link href="/shop?sort=new" className="link-underline">
            All new arrivals
          </Link>
        </div>
        <div className="grid">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="editorial">
        <div className="editorial__art" aria-hidden="true">
          <Media silhouette="scarf" tone="dark" />
        </div>
        <div className="editorial__copy">
          <p className="eyebrow">The study</p>
          <h2 className="editorial__title">Two tones, one wardrobe.</h2>
          <p>
            Every piece begins as a line drawing and ends as cloth. We work in black, white and the
            greys that fall between them — so a kurta can meet a coat, and a coat can meet a tee,
            without a single colour to negotiate.
          </p>
          <Link href="/about" className="btn btn--outline-light">
            Read the studio notes
          </Link>
        </div>
      </section>

      {essentials.length > 0 ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">The essentials</h2>
            <Link href="/shop?category=essentials" className="link-underline">
              Shop essentials
            </Link>
          </div>
          <div className="grid grid--four">
            {essentials.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="closer">
        <div className="closer__inner">
          <p className="eyebrow">Autumn / Winter 26</p>
          <h2 className="closer__title">Built in black, finished in white.</h2>
          <p className="closer__sub">
            Eighteen pieces, no colourways. Prices from {formatPrice(2900)}.
          </p>
          <Link href="/shop" className="btn btn--solid">
            Shop all pieces
          </Link>
        </div>
      </section>
    </>
  );
}
