# Utlagg — deploy & test guide

This is the full project. It **typechecks clean and builds** (`tsc --noEmit` and
`next build` both pass). Below is how to run it locally first, then put it online.

> Heads-up: `node_modules` is committed in the repo and is incomplete/unreliable.
> The zip you got does **not** include it. Always run a fresh `npm install`.
> Add `node_modules` to `.gitignore` and remove it from git when you can.

---

## 1. Install

```bash
npm install
```

## 2. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`. The **minimum to boot and click around** is:

```
DATABASE_URL=postgresql://...        # local or Railway Postgres
DIRECT_URL=postgresql://...          # same DB (used by drizzle-kit push)
NEXTAUTH_SECRET=...                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Everything else degrades gracefully when unset:
- No `STRIPE_*` → checkout/cancel return a clear error, app still runs.
- No `GOOGLE_CLOUD_API_KEY` → OCR returns 502; manual receipt entry still works.
- No `RESEND_API_KEY` → emails are skipped (logged), flows don't crash.
- No `R2_*` → image upload returns 503; metadata still saves.
- No `UPSTASH_*` → rate limiting is disabled (fail-open).
- `ADMIN_EMAILS=you@example.com` → required to reach `/admin`.

`.env.production.template` lists every variable with notes.

## 3. Create the database schema

```bash
npm run db:push        # applies the Drizzle schema to DATABASE_URL
npm run db:seed        # optional: creates test@utlagg.se / test1234
```

## 4. Run locally and TEST before going online

```bash
npm run dev            # http://localhost:3000
```

Click through:
- `/` landing, `/register`, `/login`, `/forgot-password`
- `/dashboard` (overview, receipts, stats, subscription, settings, profile)
- `/admin` (set `ADMIN_EMAILS` to your login email first)

Then test the API surface against a production-style build:

```bash
npm run build && npm run start          # serves the compiled app on :3000
BASE_URL=http://localhost:3000 ./scripts/smoke-test.sh
```

The smoke test exercises register → login → receipt CRUD → CSV export, and
clearly marks the cases that need real keys (Stripe/OCR) or a browser.

## 5. Deploy online

Pick ONE host for the app (Postgres can stay on Railway either way).

**Railway (Nixpacks)** — uses `railway.json` (build `next build`, start `next start`,
migrations auto-run via `preDeployCommand`). Set the env vars in the dashboard,
including `NEXTAUTH_URL=https://<your>.railway.app`.

> If you use the **Dockerfile** builder instead, the start command is
> `node server.js` (standalone output) — set the Railway service builder to
> Dockerfile, and note `railway.json` would otherwise force Nixpacks.

**Vercel** — `vercel link`, add the same env vars (`NEXTAUTH_URL` = your stable
domain, not a preview URL), `vercel --prod`. Postgres on Railway via its public
TCP-proxy URL. Vercel Cron runs the jobs in `vercel.json`; on Railway use the
`cron:*` scripts as Railway Cron services instead.

After deploy: re-run the smoke test against the live URL, and set up the Stripe
webhook endpoint (`/api/webhooks/stripe`) so subscription syncing works.

---

## What is NOT finished (be honest with yourself before charging customers)

- **BankID**: real mTLS client is implemented but needs a bank RP agreement +
  certificate, and the completed login isn't wired into a NextAuth session yet.
- **Fortnox**: OAuth + voucher push implemented; the BAS account mapping needs an
  accountant's sign-off before real bookkeeping.
- **OCR queue (QStash)**: client exists but the upload flow still runs OCR
  synchronously; wiring the queue end-to-end is a follow-up.
- **Admin**: impersonation and refunds are intentionally not built (security/money
  risk); MRR-over-time needs a monthly snapshot job first.
- **Sentry / pino**: not installed; a lightweight logger is used instead.
- **Compliance**: GDPR / EU AI Act / Bokföringslagen are process + legal matters,
  not just code. The technical hooks exist; the legal artifacts (DPA, lawful basis
  for storing personnummer, Skatteverket cloud-storage notification) need a lawyer.
