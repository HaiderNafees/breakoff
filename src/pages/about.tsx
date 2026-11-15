import Link from 'next/link';
import Media from '@/components/Media';
import Seo from '@/components/Seo';

export default function About() {
  return (
    <>
      <Seo
        title="The Studio"
        description="BreakOff works in black, white and the greys between them. Small-run clothing, natural fibres and hand finishing, made in Pakistan."
        path="/about"
      />

      <section className="about-hero">
        <div className="about-hero__copy">
          <p className="eyebrow">The studio</p>
          <h1 className="about-hero__title">We removed the colour so the cut could speak.</h1>
          <p className="about-hero__sub">
            BreakOff began with a single constraint: no colour. What remained was line, weight and
            finish — the things a garment is actually made of.
          </p>
        </div>
        <div className="about-hero__art" aria-hidden="true">
          <Media silhouette="kurta" tone="light" />
        </div>
      </section>

      <section className="section prose">
        <div className="prose__col">
          <h2 className="prose__title">Two tones, nothing between</h2>
          <p>
            Black absorbs, white reflects. Everything in the collection is one or the other, with a
            narrow band of grey where the cloth itself sits. It is a restriction that makes editing
            easier and dressing faster — every piece already belongs with every other piece.
          </p>
        </div>
        <div className="prose__col">
          <h2 className="prose__title">Cut once, finished by hand</h2>
          <p>
            Patterns are drafted in the studio, cut in small runs and finished by hand — collars
            turned, hems picked, edges rolled. Nothing is designed to be replaced next season.
          </p>
        </div>
      </section>

      <section className="editorial editorial--light" id="materials">
        <div className="editorial__art" aria-hidden="true">
          <Media silhouette="coat" tone="light" />
        </div>
        <div className="editorial__copy">
          <p className="eyebrow">Materials</p>
          <h2 className="editorial__title">Natural fibres, undyed where we can.</h2>
          <p>
            Cotton lawn and dobby from Faisalabad mills, khaddar from hand looms, wool-cashmere felt
            from a mill that has run the same machines for forty years, and vegetable-tanned leather
            that darkens with wear. Ivory is often simply cotton left undyed.
          </p>
          <Link href="/shop" className="btn btn--outline">
            Shop the collection
          </Link>
        </div>
      </section>

      <section className="numbers" id="making">
        <div className="numbers__item">
          <span className="numbers__value">18</span>
          <span className="numbers__label">Pieces in the collection</span>
        </div>
        <div className="numbers__item">
          <span className="numbers__value">2</span>
          <span className="numbers__label">Tones, no exceptions</span>
        </div>
        <div className="numbers__item">
          <span className="numbers__value">120</span>
          <span className="numbers__label">Units per limited run</span>
        </div>
        <div className="numbers__item">
          <span className="numbers__value">48h</span>
          <span className="numbers__label">Dispatch from Lahore</span>
        </div>
      </section>

      <section className="closer closer--light">
        <div className="closer__inner">
          <p className="eyebrow">Studio visits</p>
          <h2 className="closer__title">See the pieces in person.</h2>
          <p className="closer__sub">Lahore, Karachi and Islamabad — appointments daily.</p>
          <Link href="/stores" className="btn btn--solid">
            Find a store
          </Link>
        </div>
      </section>
    </>
  );
}
