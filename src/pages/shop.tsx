import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import Seo from '@/components/Seo';
import { allSizes, categories, products, type Category } from '@/data';

const SORTS = [
  { value: 'new', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'A – Z' },
];

const TITLES: Record<string, string> = {
  all: 'All pieces',
  women: 'Women',
  men: 'Men',
  accessories: 'Accessories',
  essentials: 'Essentials',
};

export default function Shop() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [sizes, setSizes] = useState<string[]>([]);
  const [sort, setSort] = useState('new');
  const [query, setQuery] = useState('');
  const [saleOnly, setSaleOnly] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const { category: cat, sort: sortParam, q } = router.query;
    const nextCategory = typeof cat === 'string' ? cat : '';
    setCategory(
      nextCategory === 'women' ||
        nextCategory === 'men' ||
        nextCategory === 'accessories' ||
        nextCategory === 'essentials'
        ? nextCategory
        : 'all'
    );
    const nextSort = typeof sortParam === 'string' ? sortParam : 'new';
    setSaleOnly(nextSort === 'sale');
    setSort(nextSort === 'sale' ? 'new' : nextSort);
    setQuery(typeof q === 'string' ? q : '');
  }, [router.isReady, router.query]);

  const list = useMemo(() => {
    let result = [...products];
    if (category !== 'all') result = result.filter((product) => product.category === category);
    if (saleOnly) result = result.filter((product) => Boolean(product.compareAt));
    if (sizes.length) {
      result = result.filter((product) => product.sizes.some((size) => sizes.includes(size)));
    }
    const needle = query.trim().toLowerCase();
    if (needle) {
      result = result.filter((product) =>
        `${product.name} ${product.collection} ${product.fabric} ${product.colorway}`
          .toLowerCase()
          .includes(needle)
      );
    }
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [category, sizes, sort, query, saleOnly]);

  function toggleSize(size: string) {
    setSizes((current) =>
      current.includes(size) ? current.filter((item) => item !== size) : [...current, size]
    );
  }

  const heading = saleOnly ? 'Sale' : TITLES[category] ?? 'All pieces';

  return (
    <>
      <Seo
        title={heading}
        description={`Shop ${heading.toLowerCase()} from BreakOff — monochrome kurtas, tailoring, leather and silk.`}
        path="/shop"
      />

      <header className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <span>Home</span>
          <span aria-hidden="true">/</span>
          <span>{heading}</span>
        </nav>
        <h1 className="page-title">{heading}</h1>
        <p className="page-sub">
          {list.length} {list.length === 1 ? 'piece' : 'pieces'}
          {query ? ` matching “${query}”` : ''} · black and white only
        </p>
      </header>

      <div className="shop">
        <aside className="filters" aria-label="Filters">
          <div className="filters__group">
            <h2 className="filters__title">Category</h2>
            <ul className="filters__list">
              <li>
                <button
                  type="button"
                  className={`filters__btn${category === 'all' ? ' is-active' : ''}`}
                  onClick={() => setCategory('all')}
                >
                  All pieces
                </button>
              </li>
              {categories.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`filters__btn${category === item.key ? ' is-active' : ''}`}
                    onClick={() => setCategory(item.key)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="filters__group">
            <h2 className="filters__title">Size</h2>
            <ul className="chips">
              {allSizes().map((size) => (
                <li key={size}>
                  <button
                    type="button"
                    className={`chip${sizes.includes(size) ? ' is-active' : ''}`}
                    onClick={() => toggleSize(size)}
                    aria-pressed={sizes.includes(size)}
                  >
                    {size}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="filters__group">
            <h2 className="filters__title">Availability</h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={saleOnly}
                onChange={(event) => setSaleOnly(event.target.checked)}
              />
              <span>Reduced pieces</span>
            </label>
          </div>

          <button
            type="button"
            className="filters__reset"
            onClick={() => {
              setCategory('all');
              setSizes([]);
              setSaleOnly(false);
              setSort('new');
              setQuery('');
            }}
          >
            Clear all
          </button>
        </aside>

        <div className="shop__main">
          <div className="shop__bar">
            <label className="sort">
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {list.length === 0 ? (
            <div className="empty">
              <p className="empty__title">Nothing matches those filters.</p>
              <p className="empty__body">Try clearing a size or browsing the full collection.</p>
            </div>
          ) : (
            <div className="grid grid--three">
              {list.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
