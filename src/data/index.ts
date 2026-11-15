import { accessories, essentials } from './accessories';
import { men } from './men';
import type { Category, Product } from './types';
import { women } from './women';

export type { Category, Product, Silhouette } from './types';

export const products: Product[] = [...women, ...men, ...accessories, ...essentials];

export const categories: { key: Category; label: string; blurb: string }[] = [
  { key: 'women', label: 'Women', blurb: 'Pret, tailoring and hand embroidery' },
  { key: 'men', label: 'Men', blurb: 'Kurtas, shirting and outerwear' },
  { key: 'accessories', label: 'Accessories', blurb: 'Leather, silk and pashmina' },
  { key: 'essentials', label: 'Essentials', blurb: 'The pieces worn every day' },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function byCategory(category: Category): Product[] {
  return products.filter((product) => product.category === category);
}

export function newIn(limit = 8): Product[] {
  return products.filter((product) => product.badge === 'New').slice(0, limit);
}

export function relatedTo(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (item) => item.category === product.category && item.slug !== product.slug
  );
  const rest = products.filter(
    (item) => item.category !== product.category && item.slug !== product.slug
  );
  return [...sameCategory, ...rest].slice(0, limit);
}

export function formatPrice(value: number): string {
  return `PKR ${value.toLocaleString('en-PK')}`;
}

export function allSizes(): string[] {
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '24', '26', '28', '30', '32', '34', '36', '38', 'One size'];
  const set = new Set<string>();
  products.forEach((product) => product.sizes.forEach((size) => set.add(size)));
  return order.filter((size) => set.has(size));
}
