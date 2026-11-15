import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent } from 'react';
import AuthShell from '@/components/AuthShell';
import Seo from '@/components/Seo';
import { EDITORIAL } from '@/data';
import { useAccount } from '@/lib/account';

export default function SignIn() {
  const { signIn, user, ready } = useAccount();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const next = typeof router.query.next === 'string' ? router.query.next : '/account';

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(next);
  }

  return (
    <>
      <Seo title="Sign in" description="Sign in to your BreakOff account." path="/account/login" />
      <AuthShell
        eyebrow="Your account"
        title="Welcome back."
        sub="Sign in to follow orders, keep a wishlist and save delivery details."
        image={EDITORIAL.authSignIn}
        footer={
          <p>
            New to BreakOff?{' '}
            <Link href="/account/signup" className="link-underline">
              Create an account
            </Link>
          </p>
        }
      >
        <form className="form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {error ? (
            <p className="form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--solid btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="form__aside">
            <Link href="/care#contact" className="link-underline link-underline--sm">
              Need help signing in?
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
