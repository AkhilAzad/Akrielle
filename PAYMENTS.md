# Payments & Paywall — Current State and Setup Guide

_Last reviewed: 2026-08-21_

This document describes exactly where Alkline stands on payments, and the
precise steps required to turn on a paywall later. It exists because the
functional audit found **no payment code in the repository** — payments are
greenfield. Nothing here has been faked or stubbed with credentials.

## 1. Current state (verified)

- **No payment provider is integrated.** A repo-wide search for Stripe,
  Paddle, Razorpay, LemonSqueezy, "checkout", "paywall", "subscription", and
  "billing" returns only marketing copy and unrelated matches — no SDK, no
  API route, no client code.
- **The core flow is completely free and anonymous-first.** Landing → upload →
  `/api/analyze` → results → report → (optional) account history. Nothing gates
  the scan.
- **The only payment-adjacent surface is copy, not logic:**
  - `constants/landing.ts` (FAQ): _"Your first Beauty Scan is complimentary.
    We'll always be transparent before any part of the experience requires
    payment."_
  - `config/site.ts` / `app/layout.tsx`: the word "premium" used descriptively
    in marketing metadata.
- **Implication:** the copy promises a free first scan and paid something
  after — but the "paid" part was never built, and no product decision
  (what's paid, how much, one-time vs. subscription) has been recorded in the
  codebase.

## 2. Why no code was added in this pass

The audit brief was explicit: _do not invent payment credentials, do not fake
successful payments, and do not block the core analysis flow unnecessarily._

Building a paywall responsibly requires three product decisions that are not
yet made and cannot be safely guessed:

1. **What is monetized** — e.g. the PDF report, a second/third scan, a
   "pro" tier, or history retention.
2. **The pricing model** — one-time purchase vs. subscription, and the
   price(s).
3. **The provider** — Stripe is the default recommendation, but this affects
   the entire integration.

Adding speculative pricing, plans, or a gate now would either (a) invent those
decisions, or (b) risk blocking the free flow the brief protects. So this pass
documents the integration seam and the exact remaining work instead of
shipping unused or behavior-changing code.

## 3. Recommended architecture (Stripe, provider-agnostic seam)

The codebase already has a clean pattern for an **optional, env-gated
feature**: Supabase auth. Payments should mirror it exactly so the app stays
anonymous-first and never breaks when payments are unconfigured.

### 3.1 Config gate (mirror `isSupabaseConfigured`)

Add `config/payments.ts` exposing `isPaymentsConfigured()` that returns `true`
only when the provider env vars are present. Every payment UI entry point and
gate checks this first and no-ops when false — identical to how
`isSupabaseConfigured()` hides account features today. This guarantees the free
flow is untouched until payments are deliberately turned on.

### 3.2 Server-only secrets

Follow the existing key-safety rule (see `lib/openai.ts`): the Stripe **secret
key** and **webhook signing secret** live only in server env (no
`NEXT_PUBLIC_` prefix) and are read only inside API routes. Only the
**publishable key** may be exposed to the client.

Suggested env vars:

```
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
STRIPE_PRICE_ID=price_...            # the thing being sold
NEXT_PUBLIC_APP_URL=https://alkline.com   # for success/cancel redirects
```

### 3.3 API routes (server-side; keeps the pattern of `app/api/analyze`)

- `POST /api/checkout` — creates a Stripe Checkout Session for the signed-in
  user and returns the redirect URL. Runtime `nodejs`, same as `/api/analyze`.
- `POST /api/webhook/stripe` — verifies the Stripe signature and marks the
  purchase/entitlement as fulfilled. Must read the **raw** request body for
  signature verification.

### 3.4 Entitlement storage (reuse Supabase)

Add an `entitlements` table (or a `plan`/`paid_until` column on a profiles
table) with the same RLS-by-`auth.uid()` approach as the existing `analyses`
table (see `SUPABASE_SETUP.md`). A small `getEntitlement(token)` in
`lib/supabase/db.ts` reads it. Anonymous users have no entitlement by
definition, so any gate must decide how to treat them (see §3.5).

### 3.5 Where the gate goes (do not break anonymous use)

Given the "first scan complimentary" promise, the least disruptive gate is on
the **paid artifact**, not the scan. Options, cheapest to build first:

- **Gate the PDF/report** (`/report`): show a purchase CTA instead of the
  download when `isPaymentsConfigured() && !entitled`. The analysis + on-screen
  results stay free.
- **Gate repeat scans**: allow the first scan free (tracked per account), then
  require purchase. Needs a server-side counter to be abuse-resistant.

Whatever is chosen, the gate must be a no-op when `isPaymentsConfigured()` is
false so local/unconfigured environments keep working.

## 4. Exact remaining setup (checklist)

Code/infra work (after the three product decisions in §2):

- [ ] Create a Stripe account; create a Product + Price; note the `price_...`
      ID.
- [ ] Add the env vars in §3.2 to the deployment (and `.env.local` for dev).
- [ ] Implement `config/payments.ts` with `isPaymentsConfigured()`.
- [ ] Implement `POST /api/checkout` (create Checkout Session, server-only key).
- [ ] Implement `POST /api/webhook/stripe` (raw-body signature verification →
      write entitlement).
- [ ] Add the `entitlements` table + RLS policy in Supabase; extend
      `lib/supabase/db.ts` with `getEntitlement`.
- [ ] Add the chosen gate (§3.5), guarded by `isPaymentsConfigured()`.
- [ ] Register the webhook endpoint URL in the Stripe dashboard.
- [ ] Test with Stripe test-mode cards, then switch to live keys.

## 5. What this means for the current build

Because payments are unconfigured, **the app is fully functional as a free
product today.** The marketing FAQ line about a "complimentary first scan"
should either be left as an accurate description of the current free
experience, or updated once a paywall is actually introduced — right now there
is no paid tier for it to contrast against, so it reads as "everything is
free," which is true.
