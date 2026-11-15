export type Category = 'women' | 'men' | 'accessories' | 'essentials';

export type Silhouette =
  | 'kurta'
  | 'shirt'
  | 'coat'
  | 'trouser'
  | 'tote'
  | 'scarf'
  | 'tee';

export type Product = {
  slug: string;
  name: string;
  category: Category;
  collection: string;
  price: number;
  compareAt?: number;
  badge?: 'New' | 'Sale' | 'Limited';
  colorway: string;
  silhouette: Silhouette;
  tone: 'dark' | 'light';
  sizes: string[];
  fabric: string;
  description: string;
  details: string[];
  care: string[];
  image?: string;
};
