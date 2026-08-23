# Pricing V2 + referral program

This documents the metered-scan pricing, overage/credits, and referral program
**as implemented**. All numbers below live in one place — `lib/billing/config.ts`
(money in **öre**) — and everything is gated behind the `PRICING_V2_ENABLED`
feature flag. With the flag off, the app keeps its legacy behaviour (flat
per-user scan counter, "unlimited" paid tiers) and nothing here takes effect.

## Rollout

1. `npm run stripe:setup` — idempotently creates the Stripe products/prices
   (Pro, Business, Max recurring + the credit pack) keyed by `lookup_key`, and
   prints the price IDs.
2. Put the printed IDs in `STRIPE_PRICE_PRO/FORETAG/MAX/CREDIT_PACK`.
3. Run the migration: `npm run db:migrate` (adds the `max` tier, `scan_usage`,
   `scan_credits`, `referral_rewards`, grandfathering + referral columns).
4. Set `PRICING_V2_ENABLED=true` per environment.

## Tiers (spec §2)

| Tier | Price | Scans/mo | Seats | Overage/scan | Notes |
|------|------:|---------:|------:|-------------:|-------|
| Free | 0 kr | **15** | 1 | — (hard stop) | CSV export only |
| Pro | 149 kr | 500 | 1 | 0.39 kr | Full features (SIE/PDF, VAT+BAS, mileage, full history) |
| Business | 299 kr | 1 500 | 5–10 | 0.29 kr | Multi-user, roles, approval flows, integrations |
| Max | 699 kr | 5 000 | multi | 0.19 kr | Multi-client, priority support |
| Enterprise | offert | custom | custom | — | Contact sales only |

- **Free = 15 scans per month, recurring** (not lifetime). Exposed as the single
  constant `FREE_MONTHLY_SCANS`. *(Decision §7.1: recurring is the abuse-resistant
  default while BankID is disabled — confirm before merge.)*
- **Grandfathering (§2.5):** every Pro subscription existing at migration time is
  flagged `legacy_unlimited_scans = true` and stays uncapped. The 500 cap applies
  only to Pro subscriptions created after rollout. There's a `TODO(pricing-v2)`
  in the migration + a `referral.*`/`billing.*` audit trail for the eventual,
  properly-noticed migration of legacy users.
- **Enterprise (§7.5):** SSO / API / white-label are **not built** and are no
  longer advertised as live — Enterprise is contact-sales only.

## Metering — one choke-point (spec §6)

All cap logic lives in **`lib/billing/metering.ts` → `meterScan(userId)`**, called
from `POST /api/receipts` (the single point every scanned receipt is persisted).
Do not add cap checks anywhere else. The pure decision logic is in
`lib/billing/quota.ts` (`decideScan`), unit-tested in `tests/unit/quota.test.ts`.

**Consumption order per scan:**
1. Included **monthly plan scans** (reset each cycle, no roll-over).
2. **Purchased credits** (pre-paid, roll over ≥12 months) — *before* overage.
3. **Auto-overage** at the tier's tapered rate, up to the spend cap.

- **Billing period (§2.3):** aligned to the Stripe billing anchor when known
  (`subscriptions.current_period_start/end`), else the **Europe/Stockholm**
  calendar month (`lib/billing/period.ts`). Usage is stored per period in
  `scan_usage`, keyed uniquely on `(scope, scope_id, period_start)` — a new
  period simply gets a fresh row, so the monthly quota "resets" implicitly.
- **Scope (§7.3):** usage + credits are **pooled per company** when the user
  belongs to one, else per user. *(Default per spec — confirm against team model.)*

## Overage & credit packs (spec §3)

- **Auto-overage** is *soft*: paid tiers keep working past their quota and accrue
  öre into `scan_usage.overage_billed_ore`. It's reported to Stripe **once per
  cycle** as a single invoice item at close-out (`lib/billing/overage.ts`, run by
  the reset cron) — fits the existing fixed-price subscription model, idempotent
  via `overage_flushed_at`.
- **Free has no overage** — hard stop with an upgrade prompt (never auto-charge an
  account with no card).
- **Credit pack:** 100 scans for 50 kr (`CREDIT_PACK`). Purchased via
  `POST /api/checkout/credits` (Stripe `mode: payment`); granted from the
  `checkout.session.completed` webhook, idempotent on the session id. Credits
  **expire 12 months** after purchase (consumer law) and roll over — kept in a
  separate balance (`scan_credits`) from monthly plan scans.
- **Spend cap (§3.4):** each account has an adjustable monthly overage ceiling
  (`POST /api/billing/overage-cap`), default **200 kr** (`DEFAULT_OVERAGE_CAP_ORE`).
  At the cap, auto-billing stops and the user is notified (`cap_reached`).
- **Upgrade nudge (§3.5):** two consecutive periods with overage → a
  `billing.upgrade_nudge` audit event (email hook TODO).

## Referral program (spec §4)

Rewards the **referrer** with **14 days of Pro** when someone they referred
completes their **first paid** subscription and survives a **30-day hold**.

- **Attribution:** `?ref=CODE` → cookie (middleware) → captured at signup
  (`captureReferral`), immutable, self-referral rejected. Each user has a
  non-guessable base32 `referral_code`; share link `https://kvittino.se/?ref=CODE`.
- **Trigger → vesting:** first paid invoice (`invoice.paid`, amount > 0) creates
  one `pending` reward (idempotent on `referred_user_id`). A daily cron
  (`/api/cron/vest-referrals`) grants rewards whose hold elapsed. Refund /
  chargeback / cancel-within-hold (`charge.refunded`, `charge.dispute.created`,
  `customer.subscription.deleted`) voids a pending reward. The state machine is
  pure + unit-tested (`lib/billing/referral-state.ts`, `tests/unit/referrals.test.ts`).
- **Reward mechanics (§7.4):** if the referrer is on a paid Stripe plan, we push
  the next billing date out by 14 days (trial extension); otherwise we grant a
  time-boxed Pro entitlement via the existing manual-grant machinery. **Never a
  cash payout** (no payout / moms accounting).
- **Anti-abuse:** reward requires a real paid conversion on a distinct card +
  surviving the hold. Caps: **5 / rolling 30 days**, **50 / year**. Referred-email
  dedup (normalised: lower-case, Gmail dots/`+alias` stripped) + disposable-domain
  blocklist. Ring detection blocks shared **card fingerprint / signup IP /
  normalised email**. Clawback reverses a granted reward on later fraud. Every
  transition is written to the audit log (revisionslogg).
- **New-user welcome bonus** is out of scope — extension point only
  (`REFERRAL_NEW_USER_BONUS_ENABLED`, default false).

## VAT / moms (spec §7.2)

Prices are entered as consumer-facing kronor and shown **incl. moms**. Stripe Tax
is opt-in via `STRIPE_TAX_ENABLED` (checkout adds `automatic_tax` when on), matching
the existing setup. *Default assumption — confirm inkl./exkl. treatment before merge.*

## Config surface (single source of truth)

`lib/billing/config.ts`: `TIERS`, `FREE_MONTHLY_SCANS`, `CREDIT_PACK`,
`DEFAULT_OVERAGE_CAP_ORE`, `REFERRAL.*`, `BILLING_TIMEZONE`, `pricingV2Enabled()`.
No pricing/quota/referral magic numbers live in business logic.

---

# Pricing V3 — Trial + Starter + read-only export gating

Pricing V3 **reworks** the live V2 model (it does not rebuild it). It replaces the
recurring **Free** plan with a one-time **30-day Trial**, adds a paid **Starter**
tier, drops lapsed accounts to **read-only** with **premium export gating** (CSV +
original files always available), and adds a pseudonymised **repeat-trial email
guard**. Everything is behind independently toggleable flags; with them off the
app behaves exactly as V2.

## Feature flags (spec §0)

| Flag | Default | Effect |
|------|---------|--------|
| `PRICING_V3_ENABLED` | `false` | Master switch for trial / read-only / Starter logic. |
| `EXPORT_GATING_ENABLED` | `false` | Gate SIE/SIE4/integration/premium-PDF in read-only. |
| `TRIAL_EMAIL_GUARD_ENABLED` | `false` | Enable the delete→same-email trial guard. |
| `TRIAL_REQUIRE_CARD` | `true` | Card-required trial (identity anchor). `false` = no-card variant. |

Trial shape: `TRIAL_DAYS=30`, `TRIAL_SCANS=500`, post-trial default plan **Pro**.

## Tiers (spec §2)

Free becomes a **deprecated tombstone** (`TIERS.free.selectable = false`): the enum
value + existing rows are retained for referential integrity, but it is never
offered again. Offerable ladder = `SELECTABLE_TIERS` = Starter…Enterprise.

| Tier | Price | Scans/mo | Overage/scan |
|------|------:|---------:|-------------:|
| **Trial** | 0 (30 days, once/user) | 500 (full Pro) | — (hard stop, no overage) |
| **Starter** | 50 kr | 100 | 0.50 kr |
| Pro / Business / Max / Enterprise | unchanged from V2 | unchanged | 0.39 / 0.29 / 0.19 / — |

## Access states (spec §A/§C)

`lib/billing/access.ts` → `resolveAccountState()` (pure, unit-tested) maps
`subscription_status` + trial timestamps to one of **active | trial | read_only**
and the **entitled tier** (trial → full Pro). Consumed by `scope.ts` (metering
context), `entitlements.ts` (feature gates; read-only → no premium features), and
`export-gating.ts`.

- **Trial:** `trialing` status; entitled as Pro; hard-stops at `TRIAL_SCANS` with
  **no overage** (`metering.ts`); on expiry converts (card) or lapses to read-only.
- **Read-only:** scanning/uploading blocked (`meterScan` short-circuit); premium
  exports gated; **data never deleted at lapse** — only the §7 12-month export
  ladder ever deletes.

## Export gating — one helper (spec §C)

`lib/billing/export-gating.ts` → `assertExportAllowed(userId, format)`, pure core
in `export-gating-core.ts` → `canUseExport({state}, format)`. Wired into **every**
export entry point (SIE, PDF, CSV, Skatteverket, mileage, transport, Fortnox sync).

- **Active / trial →** all formats.
- **Read-only →** `GATED_EXPORT_FORMATS` (`sie`, `sie4`, `premium_pdf`,
  `integration_fortnox`) blocked with an explicit message + CSV/originals fallback;
  `ALWAYS_AVAILABLE_EXPORTS` (`csv`, `original_files`) **never** blocked. The
  invariant is asserted in `tests/unit/export-gating.test.ts`.

## Repeat-trial email guard (spec §E)

`lib/billing/trial-guard.ts` (+ pure `trial-guard-hash.ts`). Token =
`HMAC-SHA256(normalize(email), TRIAL_GUARD_HMAC_SECRET)` (hex). Written on account
deletion **before** the wipe (only if the account consumed a trial), checked at
trial start (checkout), purged past `expires_at` by the daily
`/api/cron/trial-maintenance` job. Table `trial_email_guard` holds **only** the
hash + timestamps — no plaintext email. Retention `TRIAL_GUARD_RETENTION_MONTHS`
(24) **must match** Privacy clause F.5. Framing: **pseudonymised** personal data
on legitimate interest (Art. 6.1.f) — a secondary layer; the card-required trial
is the primary control.

## Stripe (spec §9)

- `npm run stripe:setup` now also creates the **Starter** price
  (`kvittino_starter_monthly`, 5000 öre) → `STRIPE_PRICE_STARTER`.
- Card-required trial via `trial_period_days` at checkout; the selected tier is the
  post-trial plan (full Pro entitlement during the trial regardless).
- Webhooks: `subscription` entering `trialing` → trial state + start-disclosure
  email; `trial_will_end` → pre-charge reminder (~3 days); conversion (`invoice.paid`)
  → active; conversion failure / lapse (`invoice.payment_failed` while trialing,
  `subscription.deleted`) → **read-only** (data retained). Referral reward still
  fires on **trial→paid** (first paid invoice), not trial start.

## Migration (spec §6) — human-applied in pgAdmin4

1. Apply schema: `drizzle/0009_pricing_v3_trial_starter.sql` (enum `ADD VALUE` for
   `starter` + `read_only` isolated; trial columns; `trial_email_guard`). Enum
   values can't be dropped — `free` stays a tombstone; rollback is code-level.
2. Send Free-tier withdrawal notices (advance notice required — §13.3).
3. Back-fill (idempotent, dry-run first): `npm run backfill:v3` (canonical, also
   emails notices) **or** `scripts/backfill-pricing-v3.sql` for pure-DB review.
   Active Free → 30-day trial; dormant Free → read-only; paid **untouched** (tagged
   `paid_unchanged`).
4. Flip `PRICING_V3_ENABLED=true` (then the sub-flags) per environment.

## Config surface (V3 additions)

`pricingV3Enabled()`, `exportGatingEnabled()`, `trialEmailGuardEnabled()`,
`trialRequireCard()`, `TRIAL_DAYS`, `TRIAL_SCANS`, `POST_TRIAL_DEFAULT_PLAN`,
`GATED_EXPORT_FORMATS`, `ALWAYS_AVAILABLE_EXPORTS`, `TRIAL_GUARD_RETENTION_MONTHS`,
`SELECTABLE_TIERS`, `TIERS.starter`, `TIERS.free.selectable = false`.
