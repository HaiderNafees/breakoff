import Link from 'next/link';
import Seo from '@/components/Seo';

const STORES = [
  {
    city: 'Lahore',
    name: 'Gulberg Flagship',
    address: '12-C Gulberg III, Main Boulevard, Lahore',
    hours: 'Mon – Sat, 11:00 – 21:00',
    phone: '+92 42 3500 0000',
    note: 'Full collection, alterations and studio appointments.',
  },
  {
    city: 'Karachi',
    name: 'Clifton Studio',
    address: 'Shop 4, Boat Basin, Block 5, Clifton, Karachi',
    hours: 'Mon – Sun, 12:00 – 22:00',
    phone: '+92 21 3580 0000',
    note: 'Pret and accessories. Made-to-measure by appointment.',
  },
  {
    city: 'Islamabad',
    name: 'F-7 Arcade',
    address: 'Ground floor, F-7 Markaz, Islamabad',
    hours: 'Mon – Sat, 11:00 – 20:00',
    phone: '+92 51 2650 000',
    note: 'Seasonal edit, outerwear and leather.',
  },
];

export default function Stores() {
  return (
    <>
      <Seo
        title="Stores"
        description="BreakOff stores in Lahore, Karachi and Islamabad. Studio appointments available daily."
        path="/stores"
      />

      <header className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Stores</span>
        </nav>
        <h1 className="page-title">Stores</h1>
        <p className="page-sub">Three rooms, one palette</p>
      </header>

      <div className="stores">
        {STORES.map((store) => (
          <article key={store.name} className="store">
            <p className="store__city">{store.city}</p>
            <h2 className="store__name">{store.name}</h2>
            <p className="store__address">{store.address}</p>
            <dl className="store__meta">
              <div>
                <dt>Hours</dt>
                <dd>{store.hours}</dd>
              </div>
              <div>
                <dt>Telephone</dt>
                <dd>
                  <a href={`tel:${store.phone.replace(/\s/g, '')}`}>{store.phone}</a>
                </dd>
              </div>
            </dl>
            <p className="store__note">{store.note}</p>
          </article>
        ))}
      </div>

      <section className="closer closer--light">
        <div className="closer__inner">
          <p className="eyebrow">Appointments</p>
          <h2 className="closer__title">Book a fitting.</h2>
          <p className="closer__sub">
            One hour with a stylist, the full collection pulled in your size.
          </p>
          <a className="btn btn--solid" href="mailto:care@breakoff.pk?subject=Fitting%20appointment">
            Request an appointment
          </a>
        </div>
      </section>
    </>
  );
}
