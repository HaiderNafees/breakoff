import '@/styles/global.css';
import type { AppProps } from 'next/app';
import Layout from '@/components/Layout';
import { AccountProvider } from '@/lib/account';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AccountProvider>
      <CartProvider>
        <WishlistProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </WishlistProvider>
      </CartProvider>
    </AccountProvider>
  );
}
