import Link from 'next/link';
import Seo from '@/components/Seo';

const SIZE_TABLE = [
  { size: 'XS', chest: '32', waist: '26', length: '40' },
  { size: 'S', chest: '34', waist: '28', length: '41' },
  { size: 'M', chest: '36', waist: '30', length: '42' },
  { size: 'L', chest: '38', waist: '32', length: '43' },
  { size: 'XL', chest: '40', waist: '34', length: '44' },
];

const FAQ = [
  {
    q: 'How long does delivery take?',
    a: 'Orders are dispatched from Lahore within 48 hours. Domestic delivery is 2–4 working days; international is 5–9 working days.',
  },
  {
    q: 'Can I change my size after ordering?',
    a: 'Yes — write to us within 12 hours of ordering and we will amend the order before it is packed.',
  },
  {
    q: 'Are the pieces restocked?',
    a: 'Core essentials are restocked. Limited runs of 120 units and hand-embroidered pieces are not.',
  },
  {
    q: 'Do you offer alterations?',
    a: 'Trousers ship with an unfinished hem so they can be tailored. Studio alterations are complimentary within 30 days of purchase.',
  },
];

export default function Care() {
  return (
    <>
      <Seo
        title="Customer Care"
        description="Shipping, returns, size guide, FAQ and contact details for BreakOff orders."
        path="/care"
      />

      <header className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Customer care</span>
        </nav>
        <h1 className="page-title">Customer care</h1>
        <p className="page-sub">Shipping, returns, sizing and contact</p>
      </header>

      <div className="care">
        <section className="care__block" id="shipping">
          <h2 className="care__title">Shipping</h2>
          <div className="care__body">
            <p>
              Complimentary domestic shipping on orders above PKR 10,000. Below that a flat PKR 350
              applies. International shipping is calculated at checkout by weight and destination.
            </p>
            <ul className="bullets">
              <li>Dispatched within 48 hours, Monday to Saturday</li>
              <li>Tracked delivery on every order</li>
              <li>Cash on delivery available within Pakistan</li>
              <li>Duties and taxes are the responsibility of the recipient</li>
            </ul>
          </div>
        </section>

        <section className="care__block" id="returns">
          <h2 className="care__title">Returns</h2>
          <div className="care__body">
            <p>
              Return any unworn piece within 14 days of delivery, with tags attached and in its
              original packaging. Refunds are issued to the original payment method within five
              working days of receipt.
            </p>
            <ul className="bullets">
              <li>Free returns within Pakistan</li>
              <li>Exchanges ship at no extra cost once</li>
              <li>Sale pieces are returnable within 7 days</li>
              <li>Hand-embroidered pieces must be returned uncut and unwashed</li>
            </ul>
          </div>
        </section>

        <section className="care__block" id="sizing">
          <h2 className="care__title">Size guide</h2>
          <div className="care__body">
            <p>Measurements in inches, taken flat. Between sizes, take the larger.</p>
            <div className="table-wrap">
              <table className="size-table">
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Chest</th>
                    <th scope="col">Waist</th>
                    <th scope="col">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map((row) => (
                    <tr key={row.size}>
                      <th scope="row">{row.size}</th>
                      <td>{row.chest}</td>
                      <td>{row.waist}</td>
                      <td>{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="care__block" id="faq">
          <h2 className="care__title">Questions</h2>
          <div className="care__body">
            <div className="faq">
              {FAQ.map((item) => (
                <details key={item.q} className="faq__item">
                  <summary className="faq__q">{item.q}</summary>
                  <p className="faq__a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="care__block" id="contact">
          <h2 className="care__title">Contact</h2>
          <div className="care__body">
            <p>
              Write to <a className="link-underline link-underline--sm" href="mailto:care@breakoff.pk">care@breakoff.pk</a>{' '}
              or call <a className="link-underline link-underline--sm" href="tel:+924235000000">+92 42 3500 0000</a>,
              Monday to Saturday, 10:00–19:00 PKT.
            </p>
            <p>Studio: 12-C Gulberg III, Lahore, Pakistan.</p>
          </div>
        </section>

        <section className="care__block" id="privacy">
          <h2 className="care__title">Privacy</h2>
          <div className="care__body">
            <p>
              We collect only what an order needs: name, contact details, delivery address and order
              history. Nothing is sold or shared with third parties for marketing. Cart contents are
              stored in your own browser and can be cleared at any time.
            </p>
          </div>
        </section>

        <section className="care__block" id="terms">
          <h2 className="care__title">Terms</h2>
          <div className="care__body">
            <p>
              Prices are shown in Pakistani Rupees and include applicable taxes. Product photography
              is illustrative; hand-finished pieces vary slightly. These terms are governed by the
              laws of Pakistan.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
