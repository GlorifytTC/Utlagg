# Kvitto — AI receipt scanning & expense management (Sweden)

A Next.js 14 + Drizzle + PostgreSQL foundation for an AI-powered receipt/expense
SaaS built around Swedish VAT and bookkeeping rules.

> **Status: working foundation, not a finished product.** The architecture, data
> model, API surface, auth, VAT engine, OCR pipeline and UI are implemented and
> internally consistent. It is **not** a "paste and deploy with zero debugging"
> system — see *What's real vs. what needs work* below. Anything touching money,
> tax, PII and payments needs your own testing and a review by an accountant
> before it goes near production.

> **Verified locally:** `npx tsc --noEmit` passes with zero errors (no `any`), and
> `next build` completes cleanly — all 13 routes compile, static pages generate,
> middleware builds. Next.js is pinned to a patched 14.2.x release. You still need
> real env vars (DB, Stripe, Google Vision) for the app to *function* at runtime;
> the build itself is green.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- PostgreSQL + Drizzle ORM
- NextAuth (credentials; BankID stubbed for phase 2)
- Stripe (subscriptions, SEK)
- Google Cloud Vision (OCR) with Swedish-aware field extraction
- Three.js / react-three-fiber (landing hero) + Framer Motion

## Quick start
```bash
npm install
cp .env.example .env        # fill in real values
npm run db:push             # create tables (needs DIRECT_URL)
npm run dev
```

## Environment variables
See `.env.example`. All secrets are read from `process.env` — nothing is
hard-coded. You must supply: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`,
`NEXTAUTH_URL`, `GOOGLE_CLOUD_API_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_PRICE_PRO`, `STRIPE_PRICE_FORETAG`.

## Database
```bash
npm run db:generate   # generate SQL migration from schema
npm run db:push       # push schema directly (good for first deploy)
npm run db:studio     # browse data
```
Migrations use `DIRECT_URL` (unpooled). The app runtime uses `DATABASE_URL`
(pooled, `prepare: false` for pgbouncer compatibility).

## Stripe
1. Create two recurring **SEK** prices in the Stripe dashboard (149 / 299).
2. Put their IDs in `STRIPE_PRICE_PRO` / `STRIPE_PRICE_FORETAG`.
3. Add a webhook endpoint → `/api/webhooks/stripe`, subscribe to
   `customer.subscription.created/updated/deleted`, copy the signing secret to
   `STRIPE_WEBHOOK_SECRET`.
4. Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Deployment
- **Vercel** (app): set all env vars; build `npm run build`.
- **Railway** (Postgres): copy `DATABASE_URL`/`DIRECT_URL`; run `npm run db:push`.

## Swedish VAT — important
The VAT engine in `lib/vat.ts` is **date-aware on purpose**. Sweden temporarily
cut food VAT from 12% → 6% for **1 Apr 2026 – 31 Dec 2027**; takeaway is 6%,
dine-in stays 12%, alcohol is excluded. After 2027 food reverts to 12%. Don't
replace this with a static rate map. Verify the current rules with an accountant.

## SIE 4 export (accounting)
Receipts can be exported as a **SIE 4** file (`#FORMAT PC8`, the de-facto import
format for Fortnox/Visma/Bokio) via `lib/sie-export.ts` + `GET /api/export/sie`.

Trigger it from the dashboard **Export** panel, or directly:
```
GET /api/export/sie?from=YYYY-MM-DD&to=YYYY-MM-DD[&credit=1930]
```
Each receipt becomes one balanced verification: cost account (BAS code, net of
VAT) + input VAT `2640` + a credit row. Output is transcoded to **CP437**, not
UTF-8, so å/ä/ö survive import (see `lib/cp437.ts`). A valid file needs the
company's **organisationsnummer** (`companies.orgNumber`); the endpoint returns
422 if it's missing.

**One assumption to confirm with a bookkeeper:** the model does not record *how*
each receipt was paid, so the credit account defaults to **`1930` (företagskonto/
bank)**. If receipts were paid on supplier invoice use `&credit=2440`
(leverantörsskulder); for employee out-of-pocket outlays use `2890`. Also confirm
the per-receipt BAS cost mapping. See the `TODO(accounting)` in `lib/sie-export.ts`.

## What's real vs. what needs work
**Implemented & tested logic**
- Full Drizzle schema (5 tables + enums + relations).
- Date-aware VAT engine (boundary cases verified) + gross/net split.
- OCR text-parsing heuristics (verified on sample Swedish receipts).
- Auth (register + credentials login), route protection, usage-limit enforcement.
- Receipt CRUD, CSV export (UTF-8 BOM, semicolon delimiter for Excel/sv-SE),
  audit logging, Stripe checkout + webhook tier sync.
- Landing page, pricing, dashboard, uploader, table.

**Needs your input / not production-complete**
- **Image storage**: `imageUrl` is stored but there is no upload-to-bucket step.
  Wire S3 / Cloudflare R2 / Vercel Blob and save the URL. Bokföringslagen
  requires receipt images to be retained ~7 years.
- **OCR accuracy**: Vision returns raw text; the field extraction is heuristic.
  For real accuracy use Google Document AI Expense Parser or Azure Document
  Intelligence's receipt model.
- **BankID**: stub only (`/api/bankid/auth` returns 501). Needs a bank/RP
  agreement + client certificate.
- **Monthly usage reset**: `scansUsedThisMonth` is incremented but not reset on a
  schedule — add a cron (Vercel Cron) keyed off `usageResetAt`.
- **BAS chart**: a representative subset; import the full chart from bas.se.
- **Fortnox integration, approval workflows, mileage/carbon, PDF export**:
  advertised on the marketing page but not yet built.
- **Tests, rate limiting, error monitoring**: add before launch.
- **3D hero**: needs visual QA in a browser (not verifiable headless).

## File structure
```
app/            routes + API
components/      landing/* and dashboard/*
db/             schema.ts, index.ts
lib/            auth, stripe, ocr, vat, bas, plans, audit, utils
```
