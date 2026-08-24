# AXL — Architecture

AXL is an AI beauty-intelligence web app built on **Next.js 16 (App Router)**,
**React 19**, and **TypeScript**. A user uploads one photo; a server route sends
it to a vision model; a structured beauty profile comes back and is rendered as
results and a printable report. Accounts (Supabase) are entirely optional — the
core scan is **anonymous-first** and never gated behind sign-in.

This document explains how the codebase is organized after the `src/`
reorganization and how the major flows move through it. It is a map, not a spec:
business logic was not changed during the reorganization, only relocated.

## Directory layout

```
src/
├── app/                      # Next.js App Router — routing + the one server API route
│   ├── layout.tsx            # Root layout: fonts, metadata, the provider tree
│   ├── globals.css           # Global styles (imported by layout)
│   ├── (public)/             # Public routes — no auth: /, contact, privacy, terms, onboarding
│   ├── (auth)/               # Auth routes: /signin, /auth/callback (OAuth return)
│   ├── (protected)/          # Gated routes: profile, upload, analysis, results, report, account
│   └── api/analyze/route.ts  # The only server endpoint (POST) — runs the AI analysis
│
├── components/               # Presentational + interactive React components (client)
│   ├── common/ layout/ landing/ upload/ analysis/ results/
│   ├── profile/ report/ account/ onboarding/ auth/ legal/ animations/ ui/
│
├── contexts/                 # React context providers (client state)
│   ├── AuthContext  OnboardingContext  ImageContext
│   ├── AnalysisResultContext  ProfileContext  PortfolioContext
│
├── hooks/                    # Reusable client hooks (useFileUpload, useScanSequence, …)
├── types/                    # Shared TypeScript types (no runtime code)
├── config/                   # Static app config (site.ts)
├── constants/                # UI/domain constants (upload limits, landing copy, …)
├── utils/                    # Small pure helpers (file, resultIcons, utils)
├── lib/                      # CLIENT-side domain helpers (onboarding, profile, portfolio, report, media)
│
├── backend/                  # SERVER-side logic (must never ship secrets to the browser)
│   ├── ai/                   # Vision prompts, response schema/repair (prompt, schema, precheck, openai)
│   ├── api/                  # Cross-cutting API concerns (rateLimit)
│   └── services/             # Reserved for future server services (see its README)
│
├── auth/                     # Authentication REST + session (auth, session, constants)
└── database/
    └── supabase/             # Data access over Supabase REST (config, db, profileDb, portfolioDb, storage)

supabase/schema.sql           # (repo root) Postgres schema + row-level-security policies
```

Two conventions matter for the App Router:

- **Route groups** — the parenthesized folders `(public)`, `(auth)`,
  `(protected)` are *organizational only*. Next.js strips them from the URL, so
  `src/app/(public)/contact/page.tsx` still serves `/contact`. The reorganization
  preserved every URL exactly; grouping just makes the access posture of each
  route obvious at a glance.
- **The `@/*` import alias** points at `src/*` (see `tsconfig.json`). Every
  cross-module import in the app uses this alias (e.g. `@/contexts/AuthContext`),
  so moving files only required updating the alias root plus the handful of
  prefixes that changed folder (e.g. `@/lib/supabase/*` → `@/database/supabase/*`).

---

## 1. Frontend flow

The frontend is a client-heavy App Router application. The **root layout**
(`src/app/layout.tsx`) is the single entry point that wraps every page. It loads
the Onest font, sets metadata, mounts a few ambient UI elements (adaptive grid,
smooth-scroll, reveal observer, loader), and — most importantly — establishes the
**provider tree** that supplies shared state to the whole app:

```
AuthProvider
└─ OnboardingProvider
   └─ ImageProvider
      └─ AnalysisResultProvider
         └─ ProfileProvider
            └─ PortfolioProvider
               └─ PageTransition → {page}
```

Each provider lives in `src/contexts/` and owns one slice of client state:
`ImageContext` holds the photo the user picked, `AnalysisResultContext` holds the
model's parsed result (and rehydrates the latest saved result for signed-in
users), `OnboardingContext`/`ProfileContext`/`PortfolioContext` back the profile
experience, and `AuthContext` owns the optional account/session.

Pages under `src/app/**` are thin: they compose components from
`src/components/**`, pull state from the contexts, and call domain helpers in
`src/lib/**` (client-side) or the `/api/analyze` endpoint (server-side). Styling
is Tailwind, driven by the design tokens in `tailwind.config.ts`; Tailwind scans
`src/**` for class names.

Routes are grouped by access posture. Public marketing/legal pages and the
onboarding flow are in `(public)`. The sign-in page and the OAuth return page are
in `(auth)`. The app's working surfaces — upload, analysis, results, report,
profile, account — are in `(protected)` and require a signed-in user, enforced by
the `RequireAuth` guard (or, for `/account`, an equivalent inline check)
described next.

---

## 2. Authentication flow

Authentication is **optional and client-driven**, implemented without the
Supabase SDK. `AuthContext` (`src/contexts/AuthContext.tsx`) is the brain; the
stateless REST calls live in `src/auth/auth.ts` and session persistence in
`src/auth/session.ts`.

**Session lifecycle.** On mount, `AuthContext` restores a session from
`localStorage` (key `alkline.session`). If the stored token is expired it exchanges
the refresh token for a fresh one; otherwise it adopts it directly. While this
first tick runs, `status` is `"initializing"`; it then settles to `"signed-in"`
or `"signed-out"`. A timer refreshes the token shortly before expiry, and network
failures are treated as transient (the session is kept and a retry scheduled)
rather than logging a still-valid user out.

**Route protection.** Most protected pages render inside `RequireAuth`
(`src/components/auth/RequireAuth.tsx`), a **client-side guard**. It reads
`status` from `AuthContext` — never `localStorage` directly, so a tampered local
value can't grant entry. A signed-in user sees the page; a signed-out visitor is
redirected to `/signin?next=<attempted-path>` so they return after authenticating;
during `"initializing"` it shows a calm loader instead of flashing content. The
`/account` page — the default post-auth landing (`DEFAULT_POST_AUTH_PATH`) —
performs the equivalent status check inline via `useAuth` instead of wrapping in
`RequireAuth`. (Each protected page opts in individually today; a
`(protected)/layout.tsx` could centralize this in the future — see §6.)

**The "accounts unavailable" state.** `AuthContext` exposes
`configured = isSupabaseConfigured()`. When Supabase env vars are absent, every
auth action degrades to a safe no-op, account entry points are hidden, and the UI
shows *"Accounts aren't available right now. You can still run a full beauty
scan — no sign-in required."* The scan flow is completely unaffected.

> **Build-time gotcha (important).** `isSupabaseConfigured()` reads
> `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Next.js **inlines
> `NEXT_PUBLIC_*` values into the client bundle at build time**, not at runtime.
> If a production build runs *without* those variables present, the compiled
> bundle contains empty strings and accounts appear "unavailable" in prod even
> though the variables exist in the hosting dashboard. The fix is to ensure the
> variables are set in the **build** environment and to rebuild — not merely set
> them at runtime. This is the root cause behind a previously observed prod-only
> auth-disabled state.

---

## 3. Google OAuth flow

Google sign-in is a full-page redirect against Supabase's GoTrue endpoints — no
popup, no SDK.

```
[signin page]
   stores ?next in sessionStorage (POST_AUTH_NEXT_KEY)
   calls signInWithGoogle()
        │
        ▼
AuthContext.signInWithGoogle()          src/contexts/AuthContext.tsx
   redirectTo = NEXT_PUBLIC_SITE_URL ?? `${origin}/auth/callback`
   window.location.assign( oauthAuthorizeUrl("google", redirectTo) )
        │
        ▼
GET  {SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=…   (src/auth/auth.ts)
        │  → Google consent → Supabase
        ▼
Browser returns to  /auth/callback#access_token=…&refresh_token=…&expires_in=…
        │
        ▼
/auth/callback page                      src/app/(auth)/auth/callback/page.tsx
   reads window.location.hash
   reads intended destination from sessionStorage (sanitizeNext)
   calls completeOAuth(hash)
        │
        ▼
AuthContext.completeOAuth()              src/contexts/AuthContext.tsx
   parseImplicitHash(hash)               (src/auth/session.ts)  → tokens
   sessionFromOAuthTokens(...)           (src/auth/auth.ts)     → getUser() fills the profile
   applySession(session)                 → saveSession() + scheduleRefresh()
   router.replace(next)                  → strips the token fragment, lands the user home
```

The redirect target is configurable via `NEXT_PUBLIC_SITE_URL` (falling back to
the current origin), which is what makes the callback work identically in local
dev and production. Post-auth destination and its sanitization live in
`src/auth/constants.ts` (`POST_AUTH_NEXT_KEY`, `DEFAULT_POST_AUTH_PATH`,
`sanitizeNext`).

---

## 4. Upload → API → AI → Result flow

This is the core product path and the app's only server round-trip.

```
/upload (protected)                      src/app/(protected)/upload/**
   pick or capture a photo (UploadCard / CameraCapture, useFileUpload hook)
   the File is held in ImageContext
        │
        ▼
/analysis (protected)                    src/app/(protected)/analysis/**
   POST multipart/form-data { image } → /api/analyze
        │
        ▼
POST /api/analyze  (server, runtime="nodejs")     src/app/api/analyze/route.ts
   1. rate-limit by client IP (8 requests / 60s)  → src/backend/api/rateLimit.ts
   2. parse FormData, ensure an image File is present
   3. validate type + size                         → src/constants/upload.ts
   4. read bytes → base64
   5. require GEMINI_API_KEY (server-only secret)
   6. call Google Gemini (gemini-3.6-flash :generateContent)
         body = { ANALYSIS_PROMPT + inlineData(image) }  → src/backend/ai/prompt.ts
         generationConfig.responseMimeType = "application/json"
   7. read the model's text
   8. extractJsonObject(text)                      → src/backend/ai/schema.ts
   9. coerceAnalysisResult(json)   (validate + repair to the app schema)
  10. respond with the AnalysisResult JSON the frontend already expects
        │
        ▼
AnalysisResultContext stores the result          src/contexts/AnalysisResultContext.tsx
        │
        ▼
/results  and  /report render it                  src/app/(protected)/{results,report}/**
   if signed-in and "save history" is on:
        AuthContext.saveCurrentAnalysis() → persists to Supabase (see §5)
```

The route is deliberately defensive: every failure mode (rate limit, missing or
oversized file, missing API key, unreadable/invalid model output) returns a typed
error body (`src/types/analyze.ts`) with a user-friendly message and correct HTTP
status. The `schema.ts` "coerce/repair" step guarantees the results and report UI
can't crash on a malformed field, even for old rows read back from the database.

**A note on the AI layer.** The **live** analysis path calls **Gemini** directly
via `fetch` inside the route. `src/backend/ai/` also contains `openai.ts` and
`precheck.ts` (an OpenAI-based face pre-check). These are **not wired into the
active route** and are retained as dormant/legacy code — they were kept in place
(not deleted) during the reorganization. New model logic should live alongside
them in `src/backend/ai/`.

---

## 5. Supabase database flow

All Supabase access is **dependency-free REST** (no SDK), centralized under
`src/database/supabase/` with connection details in `config.ts`. Two things make
this safe to run from the browser: only the **anon key** is ever used (never a
service-role key), and every read/write is scoped to the signed-in user by
their **access token plus row-level-security (RLS)** policies defined in
`supabase/schema.sql` (repo root).

`config.ts` derives the three API bases from `NEXT_PUBLIC_SUPABASE_URL`:

- `authBase()` → `/auth/v1` — GoTrue auth (used by `src/auth/`, §2–3)
- `restBase()` → `/rest/v1` — PostgREST table access
- `storageBase()` → `/storage/v1` — object storage

**Data access modules** (each a thin, typed wrapper, all authenticated with the
user's bearer token):

- `db.ts` — the `analyses` table: `saveAnalysis`, `listAnalyses`, `deleteAnalysis`.
  `user_id` is filled server-side by an `auth.uid()` column default and enforced
  by RLS, so it is never sent from the client.
- `profileDb.ts` — the user's profile + preferences.
- `portfolioDb.ts` — the photo portfolio.
- `storage.ts` — uploads/deletes objects in the private `user-media` bucket.

**Privacy posture.** By default only the analysis result + score are stored,
never the photo. A signed-in user who opts in to "save photos" gets the scan
image uploaded to the private bucket first (under `<userId>/scans/<id>.jpg`); the
row then records its `image_path`. Deleting a history entry removes the row *and*
its stored image. Anonymous users write nothing to the cloud — their state lives
only in `localStorage`, and on sign-in local data migrates to the cloud (cloud
wins on conflict).

---

## 6. Where future backend features should go

The `src/` split exists so that "where does this belong?" has an obvious answer.
Use these homes:

**New server endpoint** → add `src/app/api/<name>/route.ts`. Set
`export const runtime = "nodejs"` if it needs Node APIs or secret env vars. Keep
the handler thin: validate input, call into `src/backend/**`, return a typed
response. Model the error contract on `analyze/route.ts`.

**New server-only business logic / third-party integration** →
`src/backend/services/`. This is the home for code that must never reach the
browser: anything that reads secret env vars (no `NEXT_PUBLIC_` prefix), talks to
a paid API with a private key, or orchestrates the AI and database layers. See
`src/backend/services/README.md`. Route Handlers and Server Components may import
these; Client Components (`"use client"`) must not.

**New AI / vision capability** → `src/backend/ai/`. Prompts go in `prompt.ts`,
response validation/repair in `schema.ts`. Add new model clients here.

**Cross-cutting request concerns** (rate limiting, request validation, auth
middleware) → `src/backend/api/`.

**New persisted data** → add a data-access module in `src/database/supabase/`
(mirroring `db.ts`), and add the table + **RLS policies** to `supabase/schema.sql`.
Never introduce a service-role key on the client; keep every table user-scoped.

**New auth capability** (a provider, magic links, etc.) → extend
`src/auth/auth.ts` (REST calls) and wire it through `AuthContext`; keep
session/storage concerns in `src/auth/session.ts`.

**Client-only domain logic** (formatting, local stores, media helpers) →
`src/lib/**`. **Shared types** → `src/types/`. **Presentational UI** →
`src/components/**`.

### Server vs. client boundary — the one rule to remember

Anything a Client Component can import ends up in the browser bundle. Secrets and
server-only logic therefore live under `src/backend/**` and `src/app/api/**` and
are reached only through the `/api` boundary. Client code may hold **public**
config (`NEXT_PUBLIC_*`, the Supabase anon key) but never private keys
(`GEMINI_API_KEY`, `OPENAI_API_KEY`), which are read only inside server routes.

---

*Generated as part of the `src/` reorganization. No business logic was changed —
files were relocated and imports updated. Verified with `tsc --noEmit` (clean).*
