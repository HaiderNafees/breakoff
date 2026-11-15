import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getProduct, products } from '@/data';

export type CartLine = { slug: string; size: string; qty: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (slug: string, size: string, qty?: number) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = 'breakoff:cart:v1';
const CartContext = createContext<CartContextValue | null>(null);

export const FREE_SHIPPING_THRESHOLD = 10000;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(
            parsed.filter(
              (line): line is CartLine =>
                typeof line === 'object' &&
                line !== null &&
                typeof (line as CartLine).slug === 'string' &&
                typeof (line as CartLine).size === 'string' &&
                typeof (line as CartLine).qty === 'number'
            )
          );
        }
      }
    } catch {
      // corrupted storage: start empty
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage full or unavailable
    }
  }, [lines, ready]);

  const add = useCallback((slug: string, size: string, qty = 1) => {
    setLines((current) => {
      const index = current.findIndex((line) => line.slug === slug && line.size === size);
      if (index === -1) return [...current, { slug, size, qty }];
      const next = [...current];
      next[index] = { ...next[index], qty: next[index].qty + qty };
      return next;
    });
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    setLines((current) => current.filter((line) => !(line.slug === slug && line.size === size)));
  }, []);

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.slug === slug && line.size === size ? { ...line, qty: Math.max(0, qty) } : line
        )
        .filter((line) => line.qty > 0)
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.qty, 0);
    const subtotal = lines.reduce((total, line) => {
      const product = getProduct(line.slug) ?? products.find((item) => item.slug === line.slug);
      return total + (product ? product.price * line.qty : 0);
    }, 0);
    return { lines, count, subtotal, add, remove, setQty, clear, ready };
  }, [lines, add, remove, setQty, clear, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
