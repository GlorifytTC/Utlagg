# Claude Code task — Kvittino pricing rework: Trial + Starter, export gating, and repeat-trial guard

You are working in the **Kvittino** codebase (Swedish receipt-management SaaS). A metered-tier pricing implementation ("Pricing v2") is **already shipped and live**: scan tiers (Free 15/mo, Pro 500/mo, Business 1 500/mo, Max 5 000/mo, Enterprise), soft overage with tapered rates, credit packs, a per-account spend cap, and a referral program.

This single task **reworks the live model and migrates live data**. Do **not** rebuild the shipped systems — extend them. In one branch you will:

- **A.** Remove the recurring **Free** tier and replace it with a one-time **30-day full-featured Trial**.
- **B.** Add a new paid **Starter** tier (50 kr / 100 scans).
- **C.** Make lapse (expired trial or lapsed subscription) drop the account to **read-only**, and **gate SIE4/premium exports** there — while a **complete basic export always remains available**.
- **D.** Migrate existing Free-tier users and preserve all paying subscribers.
- **E.** Prevent **repeat free trials via new accounts** using a pseudonymized email token that survives account deletion.
- **F.** Insert the provided **Terms & Privacy** clauses (verbatim Swedish).

Because this modifies shipped code **and live production data**, correctness, safe migration, and the legal guardrail in §C outrank speed.

---

## 0. Ground rules

- **Rework, not greenfield.** Read what v2 actually implemented (§1) before changing anything. The real schema may differ from this doc — conform to the repo.
- **Never disturb existing paying subscribers.** Pro (incl. the original `legacy_unlimited_scans` grandfathered users), Business, and Max must keep working through the migration with no interruption or silent re-pricing. Prove this with a regression test.
- **Safe, reversible migrations.** Schema changes are migrations using the repo's tool, each with a `down` where the engine allows (note the Postgres enum exception in §7). Data back-fill is a **separate, idempotent, re-runnable** step with a dry-run/count mode — never inline in a schema migration.
- **Idempotency everywhere** — webhooks, trial conversion, back-fill, reward grants, token writes.
- **No hardcoded secrets** (HMAC key and all IDs come from the existing secret/env mechanism; update `.env.example`).
- **Feature-flag the rollout**, independently toggleable/rollback-able: `PRICING_V3_ENABLED` (master), `EXPORT_GATING_ENABLED`, `TRIAL_EMAIL_GUARD_ENABLED`, `TRIAL_REQUIRE_CARD`.
- **Money in öre; timezone Europe/Stockholm.**
- Work on branch `feat/pricing-v3-trial-starter-gating`. Commit in logical chunks.

---

## 1. Discovery (do first, then output a written plan; then proceed without waiting)

Inspect the current (post-v2) state and report:

1. **Tier modelling** — Postgres **enum**, **lookup table**, or **config constants**? List current values. (Decides the migration approach — §7.)
2. **Subscription & account state** — the status values, and whether a **read-only / grace / lockout** state already exists (the § 7 deletion-ladder: read-only, 12-month export window, 90/30/7-day warnings). Reuse it.
3. **Free-tier users** — how many are live, and how "active vs dormant" is determined (last login/scan).
4. **Grandfathered Pro** — confirm the `legacy_unlimited_scans` flag and how it's read.
5. **Stripe** — how products/prices are defined (lookup keys?), how subscriptions are created, which webhooks are handled, whether trials are used yet.
6. **Scan-metering choke-point, overage, credits, spend cap, referral tables** — locate each.
7. **Export system** — where SIE/SIE4, CSV, PDF, and accounting-integration exports are generated/triggered, and how they check entitlement today.
8. **Account deletion** — the Art. 17 erasure path: what it wipes, where the hook is.
9. **Legal pages** — how Terms/Privacy are stored/rendered (markdown/MDX/CMS/component) so §F clauses can be inserted.
10. **Email normalization / disposable-domain** logic (from referral anti-abuse) to reuse.

Output: files to add/modify, migration list, back-fill steps, assumptions.

---

## 2. Target model

| Tier | Price (kr/mo) | Scans/mo | Seats | Notes |
|---|---|---|---|---|
| **Trial** | 0, **30 days, once per user** | 500 (full Pro entitlement) | 1 | Full features for 30 days, then converts or locks read-only. Not a standing plan. No overage. |
| **Starter** *(new)* | **50** | **100** | 1 | Full core: scanning, VAT+BAS, SIE/CSV export, single user. Overage enabled. |
| **Pro** | 149 | 500 | 1 | Unchanged. + accounting integrations. `legacy_unlimited_scans` users stay uncapped. |
| **Business** | 299 | 1 500 | 5–10 | Unchanged. |
| **Max** | 699 | 5 000 | multi | Unchanged. |
| **Enterprise** | consultation | custom | custom | Unchanged. SSO/API/white-label remain roadmap/contact-sales only. |

All numbers live in the central pricing config as named constants. **Free is removed as an offerable plan** but its enum/table value is retained as a deprecated tombstone (§7) — live rows reference it until migrated.

**Overage taper** (soft overage, existing engine): Starter **0.50**, Pro **0.39**, Business **0.29**, Max **0.19** kr/scan. Credit packs and the user spend cap apply to every paid tier. Trial has **no** overage — it hard-stops at 500 with a convert prompt.

---

## 3. Part A — Replace recurring Free with a one-time 30-day Trial

1. **Entitlement:** full **Pro feature set + 500 scans** for 30 days (`TRIAL_DAYS`, `TRIAL_SCANS`). No overage during trial.
2. **One-time per user.** Durable `trial_consumed_at` (per user/account) so a trial can't be re-taken. Combined with §E, prevents farming.
3. **Card-required trial (default).** Implement via Stripe `trial_period_days` on a subscription to a **plan selected at checkout** (default Pro — §D/decisions). Full Pro entitlement during the trial regardless of selected post-trial plan; at day 31 Stripe charges the selected plan and the subscription becomes active.
   - Support a **no-card** variant behind `TRIAL_REQUIRE_CARD` (default `true`). If disabled, the trial still expires to **read-only lockout** (§C) — never to reusable free scans. Default card-required: with BankID down, it makes payment the identity anchor and neutralises new-email farming.
4. **Referred users land in the Trial** (not Free); referral otherwise unchanged (§ referral).

---

## 4. Part B — Add the Starter tier (50 kr / 100 scans)

1. End-to-end: pricing config, plan enum/table value, **new Stripe product+price** (lookup key e.g. `kvittino_starter_monthly`, `5000` öre), checkout, plan-gating, and any pricing-page/plan-selector UI (render from config).
2. **Features:** full core — scanning, VAT/BAS automation, SIE + CSV export, single user. Differentiated from Pro by **volume and integrations**, not by crippling core function (Pro adds accounting integrations + 500-scan headroom).
3. **Overage:** participates in the existing soft-overage system at the Starter rate above — a Starter user creeping over 100 auto-bills / gets an upgrade nudge, never a hard wall.

---

## 5. Part C — Lapse → read-only, with SIE4/premium export gating

When a trial ends without conversion, or a paid subscription lapses, the account goes to **read-only** (reuse the existing grace/lockout state and § 7 ladder — no parallel path). **Data is never deleted at lapse**; deletion only ever happens at the end of the 12-month export window with its warning emails.

> ### ⚠️ CRITICAL GUARDRAIL — read before implementing export gating
> In read-only / lapsed state, the following **MUST remain fully available** and must **never** be gated:
> - a **complete export of all receipts/verifikat as CSV** (structured, machine-readable),
> - **download of the original receipt/invoice files/images**, and
> - GDPR Art. 15 access and Art. 20 portability generally.
>
> The user may hold the only copy of records they are legally required to keep for 7 years. Gating **convenience/premium formats** is fine; making the underlying records **inaccessible** is not — it is serious legal exposure. When in doubt, leave an export **available**.

Implement:

1. **Single entitlement helper** `canUseExport(account, format)`, reused by **every** export entry point (one place):
   - **Active** subscription **or** active trial → all formats (SIE4, CSV, PDF, integrations).
   - **Read-only / lapsed / expired-trial** → **CSV export and original-file download allowed**; **SIE/SIE4, accounting integrations, and bulk/premium PDF packs blocked.**
2. **Config-driven lists:** `GATED_EXPORT_FORMATS` (default `SIE`, `SIE4`, `integration_*`, `premium_pdf`) and `ALWAYS_AVAILABLE_EXPORTS` (default `csv`, `original_files`). No inline format checks.
3. **Explicit messaging, never silent failure.** When a read-only user requests a gated format, return a clear response: the format needs an active subscription, here's the upgrade action, **and your CSV + original files are available here** (link them). Surfacing the fallback is part of the legal safeguard.
4. Applies uniformly to expired trials and lapsed paid accounts, including previously grandfathered-unlimited Pro users once they lapse.

---

## 6. Part D — Migrate existing live users

Idempotent, re-runnable back-fill with a dry-run/count mode. Default handling (flag for product/legal sign-off — **advance notice to Free users is required before withdrawing the plan**):

- **Active Free users** (scanned/logged in within ~60 days): start a **one-time 30-day Trial** (full Pro), set `trial_consumed_at`. No card on file → no-card trial that expires to **read-only + export** (§C). Send the plan-change/trial-start notice email.
- **Dormant Free users:** move directly to **read-only + export** under the 12-month deletion ladder, with the notice email. No trial they won't see.
- **Paid subscribers (Pro/Business/Max), incl. `legacy_unlimited_scans`:** **no change** to price, cap, or entitlement. Assert this in a regression test.
- Record, per migrated account, that notice was sent and which path was taken (for audit/support).

---

## 7. Database changes (inspect the real schema first, then apply, adapting to §1.1)

**Tier value (`STARTER`; and `TRIAL` if trial is a plan value):**
- **If Postgres `enum`:** add values with `ALTER TYPE ... ADD VALUE`. **Gotchas:** `ADD VALUE` often can't run in a transaction block with other statements (own migration step), and **enum values can't be removed** — so `FREE` **stays as a deprecated tombstone**; remove it from selectable-plans config and add a code-level `@deprecated`/guard. **Prefer representing the trial as a subscription *status*, not a plan value**, to avoid bloating the enum — decide and document.
- **If lookup table:** insert a `Starter` row; add/set a `selectable` boolean and set `Free.selectable = false` (keep the row for referential integrity).

**Subscription/account columns to add (match repo naming):**
- `trial_started_at TIMESTAMPTZ NULL`, `trial_ends_at TIMESTAMPTZ NULL`
- `trial_consumed_at TIMESTAMPTZ NULL` (one-time trial guard, per user/account)
- `post_trial_plan` (plan a card-required trial converts to)
- Extend account/subscription **status** to include `TRIALING`; ensure a `READ_ONLY`/grace state exists (reuse v2's, else add).
- Reuse existing `spend_cap_ore`, credit-balance-with-expiry, and overage columns — do not duplicate.

**New table for the repeat-trial guard (§E):**
- `trial_email_guard`: `email_hash` (unique), `created_at`, `expires_at`. **No plaintext email, no other identifying columns.**

**Back-fill migration (separate, idempotent):** implement §6, keyed so re-running is a no-op; dry-run mode; log affected row counts.

**Rollback:** provide `down` for column additions and table inserts/creates. Document that **enum value additions/removals are not reversible** in Postgres — rollback of those is code-level (stop referencing the value), not schema-level.

Update the schema/ER notes in `docs/`.

---

## 8. Part E — Email-hash guard against repeat trials (survives deletion)

Block "delete account → same email starts a new free trial" without retaining readable personal data after erasure.

1. **Hashing:** `HMAC-SHA256(normalize(email), TRIAL_GUARD_HMAC_SECRET)`.
   - `TRIAL_GUARD_HMAC_SECRET` is a **stable** server-side secret from the existing store (rotating it invalidates the table — document; never in repo).
   - **Normalize before hashing** (reuse existing logic if present): lower-case, trim, strip `+alias` suffixes; for `gmail.com`/`googlemail.com` **also** strip dots in the local part. Apply provider-specific dot-stripping **only** to Gmail-family domains (dots are significant elsewhere).
2. **On account deletion (Art. 17):** if the account consumed a trial, UPSERT its `email_hash` into `trial_email_guard` with `expires_at = now + TRIAL_GUARD_RETENTION_MONTHS` (default **24**) **before** wiping the account. Erasure otherwise proceeds fully — this token is the only thing retained.
3. **On trial start / signup:** eligibility = no account-level `trial_consumed_at` **AND** no matching non-expired `trial_email_guard` row. On match, deny the trial and offer paid plans, with **generic** messaging ("this email isn't eligible for a free trial") that doesn't confirm a prior deleted account.
4. **Retention job:** purge rows past `expires_at` on the existing scheduler.
5. **Framing (do not overclaim):** treat the hash as **pseudonymized personal data** on legitimate interest (Art. 6.1.f) — not "anonymous." Disclosed in the Privacy Policy (§F). It stops the lazy same-email path, not a determined abuser with fresh addresses (the card-required trial is the primary control) — implement as a secondary layer.

---

## 9. Stripe & billing

- Create the **Starter** price (idempotent setup script keyed by lookup key), alongside existing prices.
- **Card-required trial** via `trial_period_days`, converting to `post_trial_plan`.
- Handle webhooks idempotently, adding any missing:
  - `customer.subscription.trial_will_end` → **pre-charge reminder email** (~3 days before) — required for the consumer flow (§10).
  - trial→active conversion (first `invoice.paid`) → clear trial state, start metering; drives referral vesting (unchanged).
  - trial end **without** valid payment / `invoice.payment_failed` at conversion → move account to **read-only** (§C).
  - refund/chargeback, subscription updated/deleted → existing handling (referral void, grace) unchanged.
- Confirm **moms/VAT** treatment (see decisions): consumer-facing prices shown inkl. moms; note Stripe Tax usage.

---

## 10. Consumer-law flow (touches code, not just the ToS)

For the auto-converting trial, implement in the signup/checkout flow and emails:
- **Clear up-front disclosure** at trial start: that it converts to a paid subscription, the exact price, and the first charge date.
- **One-click self-service cancellation** during the trial.
- **Reminder email before the first charge** (via `trial_will_end`).
- Ångerrätt and existing consumer clauses continue to apply. Keep copy consistent with the ToS; surface any wording the team must confirm rather than inventing legal text (the substantive clauses are supplied in §F).

---

## 11. Referral adjustment (otherwise unchanged)

- Referred users land in the **Trial** instead of Free. The **referrer reward** (2 weeks Pro, vesting on the referred user's first **paid** conversion after the 30-day hold, with all anti-abuse controls) is unchanged. Verify it triggers on trial→paid conversion, **not** on trial start.
- Leave `REFERRAL_NEW_USER_BONUS_ENABLED` extension point in place; default unchanged.

---

## 12. Part F — Legal text to insert (verbatim Swedish; do not paraphrase)

Insert into the live legal pages, matching surrounding formatting. If placement/section numbers are unclear, insert and flag for review rather than reword.

**F.1 — Användarvillkor, new clause under § 7 (Lagring, arkivering och radering):**
> **7.7 Export i läsläge.** När ditt konto övergår till läsläge — vare sig efter avslutad provperiod eller efter att en betald prenumeration upphört — behåller du full tillgång att granska och exportera dina underlag. En fullständig export i CSV-format samt nedladdning av dina ursprungliga kvitto- och fakturafiler är alltid tillgänglig, så att du kan fullgöra din arkiveringsskyldighet enligt Bokföringslagen. Vissa tilläggsfunktioner för export — däribland export i SIE- och SIE4-format samt direktintegrationer med bokföringsprogram — förutsätter dock en aktiv betald prenumeration.

**F.2 — Användarvillkor, trial-conversion clause in the prenumeration/provperiod section:**
> **Provperiod.** Vi kan erbjuda en kostnadsfri provperiod om trettio (30) dagar. Om du inte säger upp prenumerationen före provperiodens slut övergår den automatiskt till en betald prenumeration enligt den plan och det pris du valt vid registreringen, och betalning dras då för den kommande perioden. Du kan när som helst under provperioden säga upp prenumerationen utan kostnad via dina kontoinställningar. Vi påminner dig via e-post innan den första betalningen dras.

**F.3 — Användarvillkor, one-time-trial clause:**
> **Provperioden får utnyttjas en (1) gång per användare.** Rätten till provperiod bedöms per person, inte enbart per konto eller e-postadress. För att förhindra att provperioden utnyttjas upprepade gånger genom nya konton kan vi, efter att ett konto raderats, bevara en pseudonymiserad (envägskrypterad) token som härletts från din e-postadress; närmare information finns i integritetspolicyn. Vi förbehåller oss rätten att neka eller avsluta en provperiod vid misstanke om missbruk.

**F.4 — Integritetspolicy, new row in the legal-basis table (§ 3):**
> | Förhindra upprepat utnyttjande av den kostnadsfria provperioden (pseudonymiserad token härledd från e-postadress, bevarad efter kontoradering) | Berättigat intresse (6.1.f) |

**F.5 — Integritetspolicy, new bullet under "Uppgifter vi behandlar för egen räkning" (§ 4):**
> - **Pseudonymiserad provperiodstoken** — efter att du raderat ditt konto bevarar vi en envägskrypterad (hashad) token som härletts från din normaliserade e-postadress, uteslutande för att förhindra upprepat utnyttjande av den kostnadsfria provperioden. Token kan inte återställas till din e-postadress och bevaras i högst tjugofyra (24) månader, varefter den raderas automatiskt.

**F.6 — Integritetspolicy, sentence where the right to erasure (Art. 17) is described:**
> När du utövar din rätt till radering tar vi bort dina personuppgifter, med undantag för den pseudonymiserade provperiodstoken som beskrivs i avsnittet om lagringstider och för sådana uppgifter vi är skyldiga att bevara enligt lag.

Keep the **24-month** figure in F.5 consistent with `TRIAL_GUARD_RETENTION_MONTHS`, and the price/first-charge disclosure in F.2 consistent with the checkout copy — note both couplings in the PR.

---

## 13. Decisions to surface (implement the stated default, flag for confirmation)

1. **Card-required trial** (default `true`) vs no-card — default abuse-resistant with BankID down.
2. **Default post-trial plan** when not actively chosen — default **Pro** (could be Starter to lower the convert price).
3. **Existing-Free migration paths** (active→trial, dormant→read-only) and the **notice email** — needs product/legal sign-off before running in production.
4. **Trial as subscription-status vs plan-enum value** — pick per the actual schema; document.
5. **Gated-format list** — default gates SIE family + integrations + premium PDF, keeps CSV + original files open. Confirm SIE4 is the intended hook.
6. **Email-token retention horizon** — default 24 months (must match F.5).
7. **Deny-trial messaging** — default generic wording.
8. **moms/VAT** display for Starter and the trial-conversion price — consumer-facing inkl. moms; confirm Stripe Tax.

---

## 14. Quality bar & deliverable

- Reuse v2's metering choke-point, overage engine, credit logic, spend cap, grace/deletion ladder, and referral system — extend, don't duplicate.
- Tests:
  - Trial lifecycle (start→convert, start→expire-to-read-only), one-time-trial guard, referral fires on trial→paid (not trial start).
  - Starter quota + overage taper; credit consumption before overage.
  - `canUseExport`: active/trial → all formats; read-only → CSV + original files **allowed**, SIE4/integrations/premium **blocked**. Include an explicit test asserting CSV and original-file export are **never** blocked in read-only (guards the legal invariant).
  - Email guard: normalization (Gmail dots/aliases vs other domains), deletion writes the hash, repeat/aliased email is denied, expired token no longer blocks, **plaintext email never stored**, erasure completes except the token.
  - **Regression test proving existing Pro/Business/Max/legacy-unlimited subscribers are unchanged by the migration.**
  - Back-fill migration on seeded data (active-Free, dormant-Free, each paid tier, grandfathered Pro); webhook idempotent replay.
- Update `.env.example` (`TRIAL_GUARD_HMAC_SECRET`, all feature flags, retention constant), `docs/pricing.md` and privacy/schema docs, and confirm inserted legal clauses render.
- Deliver branch `feat/pricing-v3-trial-starter-gating` with: schema migrations + idempotent back-fill + Stripe setup + trial/Starter/read-only/export-gating logic + email-hash guard + deletion-hook change + consumer-flow emails + legal-text insertions + tests + docs. PR description must cover: what changed vs v2, the §13 decisions and defaults taken, migration row-count expectations, the HMAC-secret stability caveat, the ToS↔constant couplings (24-month token; trial price disclosure), and the **manual pre-launch steps** (Stripe dashboard verification, sending Free-tier withdrawal notices, enabling `PRICING_V3_ENABLED`).
