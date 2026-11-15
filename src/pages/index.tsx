import Link from 'next/link';
import HeroCarousel, { type HeroSlide } from '@/components/HeroCarousel';
import Photo from '@/components/Photo';
import ProductCard from '@/components/ProductCard';
import Seo from '@/components/Seo';
import { categories, EDITORIAL, formatPrice, products } from '@/data';

const HERO_SLIDES: HeroSlide[] = [
  {
    image: EDITORIAL.hero,
    eyebrow: 'Autumn / Winter 26',
    title: (
      <>
        Cut from
        <br />
        a single line.
      </>
    ),
    sub: 'Black and white, nothing between. Kurtas, tailoring and leatherwear made in small runs and built to be worn until they show.',
    silhouette: 'coat',
    tone: 'dark',
    cta: (
      <>
        <Link href="/shop" className="btn btn--solid-light">
          Shop the collection
        </Link>
        <Link href="/about" className="btn btn--ghost-light">
          The studio
        </Link>
      </>
    ),
  },
  {
    image: '/img/coat-man.jpg',
    eyebrow: 'The outerwear study',
    title: (
      <>
        Black,
        <br />
        nothing else.
      </>
    ),
    sub: 'Leather, wool and a shoulder cut soft. Outerwear with the hardware left visible, finished by hand in Lahore.',
    silhouette: 'coat',
    tone: 'dark',
    cta: (
      <>
        <Link href="/shop?category=men" className="btn btn--solid-light">
          Shop outerwear
        </Link>
        <Link href="/shop?sort=new" className="btn btn--ghost-light">
          New arrivals
        </Link>
      </>
    ),
  },
  {
    image: '/img/street-shopping.jpg',
    eyebrow: 'Everyday uniforms',
    title: (
      <>
        Made to
        <br />
        be worn.
      </>
    ),
    sub: 'The pieces that do the work every day — heavy jersey, wide trousers and a bag that holds everything.',
    silhouette: 'tee',
    tone: 'light',
    cta: (
      <>
        <Link href="/shop?category=essentials" className="btn btn--solid-light">
          Shop essentials
        </Link>
        <Link href="/shop?category=accessories" className="btn btn--ghost-light">
          Accessories
        </Link>
      </>
    ),
  },
];

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

      <HeroCarousel slides={HERO_SLIDES} />

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
                <Photo
                  images={[EDITORIAL.categories[category.key] ?? EDITORIAL.hero]}
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
                  alt={category.label}
                  sizes="(max-width: 600px) 50vw, 25vw"
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
          <Photo
            images={[EDITORIAL.editorial]}
            silhouette="scarf"
            tone="dark"
            alt=""
            sizes="(max-width: 860px) 100vw, 50vw"
          />
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
            {products.length} pieces, no colourways. Prices from {formatPrice(2900)}.
          </p>
          <Link href="/shop" className="btn btn--solid">
            Shop all pieces
          </Link>
        </div>
      </section>
    </>
  );
}
