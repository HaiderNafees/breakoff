import { useEffect, useRef, useState, type ReactNode } from 'react';
import Photo from '@/components/Photo';
import type { Silhouette } from '@/data';

export type HeroSlide = {
  image: string;
  eyebrow: string;
  title: ReactNode;
  sub: string;
  cta: ReactNode;
  silhouette: Silhouette;
  tone: 'dark' | 'light';
};

/** Seven and a half seconds per frame: long enough to read the headline twice. */
const INTERVAL = 7500;

/**
 * Full-bleed hero that advances itself. It keeps the original layout and
 * treatment, pauses while hovered, focused or hidden, and never moves for
 * visitors who ask for reduced motion.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const paused = hovered || focused || hidden;

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL);
    return () => window.clearTimeout(timer);
  }, [index, paused, slides.length]);

  function go(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured pieces"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(index + 1);
        if (event.key === 'ArrowLeft') go(index - 1);
      }}
      onPointerDown={(event) => {
        pointerStart.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStart.current === null) return;
        const delta = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(delta) > 48) go(index + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="hero__art" aria-hidden="true">
        {slides.map((item, position) => (
          <div
            key={item.image}
            className={position === index ? 'hero__slide is-active' : 'hero__slide'}
          >
            <Photo
              images={[item.image]}
              silhouette={item.silhouette}
              tone={item.tone}
              alt=""
              priority={position === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      <div className="hero__inner">
        <div className="hero__copy" key={index}>
          <p className="eyebrow eyebrow--light">{slide.eyebrow}</p>
          <h1 className="hero__title">{slide.title}</h1>
          <p className="hero__sub">{slide.sub}</p>
          <div className="hero__cta">{slide.cta}</div>
        </div>
        <ul className="hero__meta">
          <li>Small-run production</li>
          <li>Natural fibres</li>
          <li>Made in Pakistan</li>
        </ul>
      </div>

      {slides.length > 1 ? (
        <div className="hero__nav">
          <button
            type="button"
            className="hero__arrow"
            onClick={() => go(index - 1)}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>

          <div className="hero__dots" role="tablist" aria-label="Choose a slide">
            {slides.map((item, position) => (
              <button
                key={item.image}
                type="button"
                role="tab"
                aria-selected={position === index}
                aria-label={`Slide ${position + 1} of ${slides.length}`}
                className={position === index ? 'hero__dot is-active' : 'hero__dot'}
                onClick={() => go(position)}
              />
            ))}
          </div>

          <button
            type="button"
            className="hero__arrow"
            onClick={() => go(index + 1)}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      ) : null}
    </section>
  );
}
