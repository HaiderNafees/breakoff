import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent } from 'react';
import AuthShell from '@/components/AuthShell';
import Seo from '@/components/Seo';
import { EDITORIAL } from '@/data';
import { useAccount } from '@/lib/account';

export default function SignUp() {
  const { signUp, user, ready } = useAccount();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace('/account');
  }, [ready, user, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    setBusy(true);
    const result = await signUp(name, email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/account');
  }

  return (
    <>
      <Seo
        title="Create an account"
        description="Create a BreakOff account to track orders and save pieces."
        path="/account/signup"
      />
      <AuthShell
        eyebrow="Join the house"
        title="Create your account."
        sub="An account keeps your orders, delivery details and saved pieces in one place."
        image={EDITORIAL.authSignUp}
        footer={
          <p>
            Already registered?{' '}
            <Link href="/account/login" className="link-underline">
              Sign in
            </Link>
          </p>
        }
      >
        <form className="form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Haider Nafees"
              required
            />
          </div>
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
          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="6+ characters"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm</label>
              <input
                id="confirm"
                type="password"
                name="confirm"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          {error ? (
            <p className="form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--solid btn--block" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>

          <p className="form__aside">
            By continuing you agree to our{' '}
            <Link href="/care#terms" className="link-underline link-underline--sm">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/care#privacy" className="link-underline link-underline--sm">
              privacy policy
            </Link>
            .
          </p>
        </form>
      </AuthShell>
    </>
  );
}
