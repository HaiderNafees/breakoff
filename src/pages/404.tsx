import Link from 'next/link';
import Seo from '@/components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" description="This page could not be found." path="/404" />
      <div className="closer closer--light" style={{ minHeight: '58vh', display: 'grid', placeItems: 'center' }}>
        <div className="closer__inner">
          <p className="eyebrow">404</p>
          <h1 className="closer__title">This line ends here.</h1>
          <p className="closer__sub">The page you were looking for has moved or sold out.</p>
          <Link href="/shop" className="btn btn--solid">
            Shop all pieces
          </Link>
        </div>
      </div>
    </>
  );
}
