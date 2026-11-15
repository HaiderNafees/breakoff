import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type WishlistValue = {
  slugs: string[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = 'breakoff:wishlist:v1';
const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSlugs(parsed.filter((slug): slug is string => typeof slug === 'string'));
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      // storage unavailable
    }
  }, [slugs, ready]);

  const toggle = useCallback((slug: string) => {
    setSlugs((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [slug, ...current]
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setSlugs((current) => current.filter((item) => item !== slug));
  }, []);

  const clear = useCallback(() => setSlugs([]), []);

  const value = useMemo<WishlistValue>(
    () => ({
      slugs,
      count: slugs.length,
      has: (slug: string) => slugs.includes(slug),
      toggle,
      remove,
      clear,
      ready,
    }),
    [slugs, toggle, remove, clear, ready]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
}
