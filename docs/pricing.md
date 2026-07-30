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
