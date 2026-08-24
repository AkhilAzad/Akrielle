# AXL — Current Project Assessment

_Read-only assessment. No project code was changed, deleted, or rewritten to produce this document. Prepared 2026-08-24._

AXL is a **Next.js 16 web application** that gives a user an AI-generated "Beauty Profile" from a single photo: they upload or snap a face photo, it's sent to a Google Gemini vision model, and the app renders a structured analysis (scores, facial-feature breakdown, and personalized product/style recommendations) with an optional printable report and optional saved history. It is **anonymous-first** — the entire scan-to-results flow works with no account — and accounts/history are an optional layer that is fully coded but currently switched off.

---

## 1. Everything AXL currently does (working today)

**Marketing landing page** (`app/page.tsx`). A polished, animated, responsive one-pager: hero with a cursor "liquid-reveal" portrait and a live-analysis metric card, "how it works," features, "why AXL," FAQ, and CTAs routing to the upload flow. All copy is centralized in `constants/landing.ts`.

**Photo intake** (`app/upload/page.tsx`, `components/upload/*`, `hooks/useFileUpload.ts`). Three ways to provide a photo, all converging on one validation path:
- Drag-and-drop
- Click-to-browse file picker
- **Live camera capture** (`CameraCapture.tsx`) — `getUserMedia`, rear-camera preference, mirrored selfie preview with a correctly **un-mirrored** saved JPEG, retake/confirm, and graceful handling of permission denial and unsupported browsers.

Client-side validation enforces file type (JPEG/PNG/WebP), size (≤10 MB), and a minimum dimension (200 px) before anything is sent.

**AI analysis** (`app/analysis/page.tsx` → `POST /api/analyze`). The selected image is POSTed to the one backend route, which calls Gemini and returns a structured Beauty Profile. A cosmetic "scanning" animation plays while the real request runs; the app only advances when the request actually succeeds. Errors are differentiated: transient failures offer in-place **Retry**, photo-specific failures prompt "use a different photo."

**Results** (`app/results/page.tsx`, `components/results/*`). Renders the full profile from real API data:
- Beauty score + confidence
- Glow-up potential (current vs. potential score + reasoning)
- Six profile attributes: face shape, skin tone, undertone, eye shape, lip shape, facial harmony
- Up to ~14 per-feature facial analyses (each with confidence, status, explanation)
- Prioritized "impact improvements" (area, priority, explanation, expected improvement)
- Eight recommendations: foundation, lipstick, blush, eyeshadow, highlighter, hairstyle, accessories, skincare

**Printable report** (`app/report/page.tsx`, `components/report/PrintableReport.tsx`). Builds a clean, icon-free report model and produces a "PDF" via the browser's print-to-PDF (`window.print()` with dedicated print CSS).

**Optional accounts & history** (`app/signin`, `app/account`, `app/auth/callback`, `context/AuthContext.tsx`, `lib/supabase/*`). Fully coded: email+password and Google OAuth sign-in/up, localStorage-persisted session with automatic token refresh, save-analysis-to-history (auto-save banner on results), and a history list with view/delete. **This layer is dormant** because Supabase credentials are not configured (see §2/§6).

**Legal/support pages**: privacy, terms, contact (`components/legal/LegalLayout.tsx`).

**In-session persistence**: the latest analysis result is mirrored to `sessionStorage`, so results/report survive a refresh **within the same tab**.

---

## 2. Partially implemented

- **Accounts / history / database** — code-complete but **inert**. Every DB and auth action is gated behind `isSupabaseConfigured()`, and the two `NEXT_PUBLIC_SUPABASE_*` env vars are present-but-empty, so the feature self-disables at runtime. Turning it on is a configuration step, not a coding step (see `SUPABASE_SETUP.md`).
- **Face quality pre-check** — a second AI call (`lib/analysis/precheck.ts`, using an OpenAI model) is written but **never invoked anywhere** in the app. Consequently the "no face detected / multiple faces / low quality" error states that the UI knows how to display can never actually be triggered. So input-quality gating is effectively not in force.
- **Hero visual fidelity** — the liquid-reveal component is passed the *same* image for both its "before" and "reveal" layers, so the cursor wipe shows no before/after contrast. Cosmetic only.
- **"Complimentary first scan" framing** — FAQ/marketing copy implies a free-then-paid model, but there is no paid tier to contrast against (see §3, payments).

---

## 3. Missing or broken

- **Payments: entirely absent.** `PAYMENTS.md` is a plan only — no Stripe/other SDK, no checkout route, no webhook, no paywall, no entitlements table. The product is 100% free today.
- **No photo storage / re-analysis.** By design, the uploaded image is processed in memory and discarded; history stores only the result JSON + score, so there is no gallery or "re-run on my old photo."
- **Abuse control is weak.** The only guard on the (cost-incurring) analyze endpoint is an **in-memory, per-IP rate limit (8/min)** that resets on every deploy and is not shared across serverless instances — it won't hold up as a real quota on Vercel.
- **Privacy-policy inaccuracy.** `app/privacy/page.tsx` (and FAQ copy) tells users their photo is sent to **"OpenAI,"** but the live endpoint sends it to **Google Gemini**. This is a user-facing/compliance mismatch worth correcting.
- **Dead code** carried in the repo: `lib/openai.ts`, `lib/analysis/precheck.ts`, `constants/results.ts` (old mock data), `utils/report.ts` (superseded by print), `components/landing/BeautyIntelligenceMap.tsx`, and the entire `HeroVisual.tsx` tree (`ParticleField`, `ScanRings`, `FaceMeshSvg`, `ConnectorLines`, `MetricChip`). The `openai` npm dependency is unused.
- **No automated tests** and no CI; `next lint` is the only quality gate besides `tsc`.
- **State-loss edges.** The selected image lives only in memory, so refreshing mid-analysis restarts the scan, and opening results/report in a *new* tab (or after closing the tab) shows an empty state.
- **Verify the Gemini model name.** The route targets `gemini-3.6-flash`. Confirm this is a currently-available model in your Google AI Studio / Gemini API project — if the model id is wrong or retired, every analysis will fail at the model call. (This is a "confirm it's live," not a confirmed defect.)

---

## 4. Technologies in use

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5.6 (strict) |
| Styling | Tailwind CSS 3.4 + custom design tokens; PostCSS/autoprefixer |
| Animation | framer-motion 11 |
| Icons / utils | lucide-react, clsx, tailwind-merge |
| AI (live path) | Google Gemini via REST (`generativelanguage.googleapis.com`, `gemini-3.6-flash`) |
| AI (unused) | OpenAI SDK (`openai` ^7.3.0) — present but not wired to any live path |
| Auth + DB | Supabase (Postgres + GoTrue) via **raw REST/PostgREST** (no `@supabase/supabase-js` SDK) |
| Deploy target | Vercel (Node.js runtime for the API route; static assets in `public/`) |
| Tooling | `next lint`; no test framework; no extra state library (React Context only) |

---

## 5. Backend APIs that already exist

There is **exactly one** server endpoint in the whole codebase; everything else labeled "backend" runs client-side.

**`POST /api/analyze`** (`app/api/analyze/route.ts`, Node.js runtime)
- Accepts `multipart/form-data` with a single `image` field.
- Validation order: IP rate-limit → image present → non-empty → allowed MIME type → size ≤ 10 MB.
- Base64-encodes the image and calls Gemini `:generateContent` with the analysis prompt (`lib/analysis/prompt.ts`), requesting a JSON response.
- Parses/extracts/validates/coerces the model output (`lib/analysis/schema.ts`) into an `AnalysisResult`.
- Returns the result JSON (200) or a structured error `{ code, error, retryAfter? }` with proper status codes (400/429/500/502) and a `Retry-After` header on rate-limit.
- Requires the `GEMINI_API_KEY` server env var (currently set).

**Not present:** no other route handlers, no `middleware.ts`, no server actions, no edge functions, no checkout/webhook routes. **Auth and database access are not server routes** — the browser calls Supabase's REST API directly (RLS-scoped by the user's token). The `services/` directory exists but is empty.

---

## 6. Database / data currently stored

**Engine:** Supabase Postgres. **Schema** (`supabase/schema.sql`) defines a single table:

**`public.analyses`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, default `auth.uid()`, FK → `auth.users(id)` ON DELETE CASCADE |
| `created_at` | timestamptz | default `now()` |
| `beauty_score` | integer | rounded score, kept as a column for cheap sorting |
| `result` | jsonb | the full `AnalysisResult` object |

- Index on `(user_id, created_at desc)`; **RLS enabled** with read/insert/delete policies all scoped to `auth.uid() = user_id`; `anon` role granted nothing; there is **no UPDATE** path (rows are immutable).
- **Stored:** the analysis result + score, owned by a user. **Never stored:** the photo itself (no Supabase Storage anywhere). No profiles table, no entitlements table.
- **Reality today:** because Supabase env vars are empty, **nothing is actually persisted** — history is a dark feature. The only "storage" in effect is per-tab `sessionStorage` holding the latest result client-side.

---

## 7. What can be reused for a mobile app

The **entire domain/back-of-house layer is portable** and represents the majority of the app's real value:

- **The AI contract:** the Gemini prompt (`lib/analysis/prompt.ts`), the result schema with coercion/repair (`lib/analysis/schema.ts`), and the `AnalysisResult` type.
- **The analyze endpoint logic** (`app/api/analyze/route.ts`) — can be reused as-is by having the mobile app call the same hosted API.
- **The report model builder** (`lib/report/model.ts`) — pure, serializable, UI-agnostic.
- **Supabase schema + RLS + the auth-flow design** — backend-agnostic; a mobile client authenticates and reads/writes identically.
- **All product copy, constants, and the design language / color-and-type tokens.**

**Not directly reusable** (web-specific, must be rebuilt natively): the React-DOM UI, Tailwind/DOM styling, framer-motion animations, the `<canvas>` liquid-reveal, the `getUserMedia`/canvas camera, and the `window.print()` PDF path.

---

## 8. What must be built from scratch for mobile

- **Native UI** for every screen (landing/onboarding, upload, scanning, results, report, sign-in, account).
- **Native camera + gallery** (e.g. `expo-camera` / `expo-image-picker`) replacing `getUserMedia` + canvas, plus native multipart upload to the API.
- **Native auth** UI with **secure token storage** (iOS Keychain / Android Keystore) and a native/deep-link Google OAuth flow.
- **Native PDF / share** to replace browser print (generate a PDF or use the OS share sheet).
- **A durable hosted backend**: the analyze endpoint must live somewhere the app can call (Vercel function or Supabase Edge Function), with the Gemini key server-side (already the case) and **real rate-limiting/quota** (e.g. Upstash Redis) since per-IP won't work for mobile networks.
- **App-store scaffolding**: bundle IDs, signing, store listings, privacy nutrition labels, deep linking, push notifications (optional), offline/error handling.
- **Payments** (if monetizing): note that Apple/Google generally require their **in-app purchase** billing for digital goods — RevenueCat (wrapping StoreKit/Play Billing) or Stripe where permitted.

---

## 9. Recommended architecture for a full Android + iOS app

**Recommended: React Native + Expo in a shared TypeScript monorepo**, keeping the existing web app and adding a mobile app around a shared core. This maximizes reuse of the parts that matter (the AI contract, schema, report model, auth/DB design) and lets one team ship both platforms.

```
axl/
├─ packages/
│  └─ core/          # shared TS: AnalysisResult type, schema+coercion,
│                    #   Gemini prompt, report model, API client, constants
├─ apps/
│  ├─ web/           # existing Next.js 16 app (unchanged conceptually)
│  └─ mobile/        # Expo (React Native) — native camera, screens, auth UI
└─ infra/
   └─ (Supabase project + one hosted analyze API)
```

- **Backend:** promote the analyze logic to a **single shared API** used by both web and mobile — either keep it as the Next.js route or move it to a **Supabase Edge Function** (co-locates with auth/DB, avoids CORS friction, one deployment surface). Keep the Gemini key server-only. Add **durable rate limiting + per-account quota** (Upstash Redis / Postgres counter) to replace the in-memory limiter.
- **Auth + data:** Supabase for both platforms (the current RLS design already fits). Use the official `@supabase/supabase-js` SDK on mobile with secure token storage; consider adopting it on web too to retire the hand-rolled REST layer.
- **Consider the face pre-check:** either wire up the existing precheck (so bad photos fail fast and cheaply) or delete it as dead code — but decide, since the UI already anticipates its error states.
- **Payments (if/when):** integrate via **RevenueCat** for mobile IAP and/or Stripe for web, gated behind an `isPaymentsConfigured()` flag mirroring the existing Supabase pattern; store entitlements in a new RLS-protected table.
- **PDF/report:** render `ReportModel` with `react-native-print` / `expo-print` on mobile; keep print-to-PDF on web.
- **Alternative (not recommended for speed):** fully native (Swift + Kotlin) for maximum fidelity/performance, but it doubles UI effort and shares only the backend + schema — worthwhile only if native performance or platform-specific UX is a hard requirement.

**Preserve the two principles the codebase already gets right:** *anonymous-first* (never gate the core scan) and *optional, env-gated features* (accounts, and later payments, degrade to no-ops when unconfigured).

---

### Two quick corrections worth making regardless of the mobile decision

1. **Privacy copy vs. reality:** update the privacy policy/FAQ to name **Google Gemini** (not OpenAI) as the image processor.
2. **Confirm the Gemini model id** (`gemini-3.6-flash`) is current in your Gemini API project so analyses don't fail at the model call.
a