# Deploying BreakOff

The storefront and its API live in one Next.js app, so Vercel hosts both. The
only external piece is a Postgres database for accounts, sessions and orders.

## 1. Create the database

Pick either; the app only needs a `DATABASE_URL`.

**Supabase (free)** — Project Settings → Database → Connection pooling →
copy the URI. Use the **pooler** host on port `6543`, not the direct connection:
the direct one is IPv6-only and Vercel functions may not reach it. The URI
already contains the password.

**Neon (free)** — Dashboard → Connect → copy the pooled connection string. Neon
wakes automatically after idle, so a quiet site still works.

No migration is needed. The first request creates `bo_users`, `bo_sessions` and
`bo_orders` with `create table if not exists`.

## 2. Deploy to Vercel

1. Import `HaiderNafees/breakoff` in Vercel (framework preset: Next.js).
2. Add these Environment Variables (Production **and** Preview):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Postgres URI from step 1 |
   | `SITE_URL` | `https://<your-project>.vercel.app` |
   | `ADMIN_TOKEN` | a long random string you keep private |
   | `STRIPE_SECRET_KEY` | `sk_test_…` or `sk_live_…` (optional) |
   | `STRIPE_WEBHOOK_SECRET` | from step 3 (optional) |

3. Deploy. Open the site, create an account, and reload: the session and the
   account must still be there. That is the proof the database is wired up.

`SITE_URL` must match the deployed origin, otherwise Stripe redirects back to
the wrong host. `VERCEL_URL` is used as a fallback when it is unset.

## 3. Stripe (optional)

Add the webhook endpoint in the Stripe dashboard:

```
https://<your-project>.vercel.app/api/webhooks/stripe
```

Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`. Copy the
signing secret into `STRIPE_WEBHOOK_SECRET`.

Without Stripe keys the checkout stays in demo mode: orders are recorded, no
card is charged, and the confirmation says so.

## 4. Fulfilment

Orders move only when you say so:

```bash
curl -X POST https://<your-project>.vercel.app/api/admin/orders/BO-XXXXXX/status \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"status":"dispatched","trackingNumber":"BOPK123456789"}'
```

Statuses: `placed`, `confirmed`, `packed`, `dispatched`, `out-for-delivery`,
`delivered`, `cancelled`. Customers follow it at `/track`.

## Local development

Leave `DATABASE_URL` empty. Accounts and orders go to `.data/store.json`
(gitignored) and the app runs with `npm run dev`.
