# Service Layer Architecture — Analysis & Extraction Plan

_Analysis only. No source files were modified to produce this document; every item under "Extraction Plan" is a proposal, sequenced so each phase is independently shippable and verifiable with `tsc --noEmit`._

**Date:** 2026-08-24
**Scope:** the full data/service layer — `src/backend/{ai,api,services}`, the six `src/contexts/*`, `src/database/supabase/*`, and the `src/lib/*` helpers that back them, plus the single API route (`src/app/api/analyze/route.ts`).

---

## 1. Executive summary

The codebase already contains a good architectural template — it just isn't applied evenly.

Two orchestration modules, `backend/services/analysisService.ts` and `lib/history/historyService.ts`, are exemplary: they compose thin, single-purpose primitives (an AI client, a repository, a storage helper, a schema coercer) into a feature behavior, while the HTTP route and the database accessors stay deliberately dumb. `historyService` even documents the move: its orchestration "previously lived INSIDE db.ts" and was pulled out so "the repository stays a single-resource PostgREST accessor while the cross-resource logic lives here."

That same pattern has **not** reached the client contexts or the low-level primitives. Two contexts (`PortfolioContext`, `ProfileContext`) inline substantial cloud/local orchestration directly alongside React state. A third (`AnalysisResultContext`) hand-rolls `sessionStorage` access instead of using a store module like every other feature. And underneath, a handful of small primitives are duplicated verbatim across files.

None of this is broken — the app typechecks clean and the security posture is sound (anon key public by design, RLS-scoped, no service-role key anywhere). The opportunity is consistency: pull the repeated primitives into single sources, and give the contexts the same thin-shell-over-service shape that `historyService` already models.

---

## 2. Current architecture map

The intended dependency direction is **route/UI → service (orchestration) → primitives (AI client · repository · storage · store)**, with `backend/ai/{schema,prompt}` sitting as shared, client-safe pure modules.

```
                         ┌───────────────────────────────────────────────┐
  app/api/analyze/       │  route.ts  (thin HTTP adapter: rate-limit,      │
  route.ts  ────────────▶│            multipart parse, serialize errors)   │
                         └───────────────┬───────────────────────────────┘
                                         ▼
                         backend/services/analysisService.ts  (orchestration)
                                 │            │              │
                     validate ◀──┘   ┌────────┘              └────────┐
                                     ▼                                ▼
                         backend/ai/gemini.ts            backend/ai/schema.ts + prompt.ts
                         (server-only Gemini POST)       (PURE, client-safe)

  ── client side ─────────────────────────────────────────────────────────

  contexts/AnalysisResultContext ──▶ lib/history/historyService ──▶ database/supabase/db
                    │ (hand-rolled sessionStorage)          │        database/supabase/storage
                    ▼                                        └──────▶ backend/ai/schema (coerce)
              sessionStorage

  contexts/PortfolioContext  ──(orchestration INLINED)──▶ database/supabase/portfolioDb
                                                       ├─▶ database/supabase/storage
                                                       └─▶ lib/portfolio/store (local)

  contexts/ProfileContext    ──(orchestration INLINED)──▶ database/supabase/profileDb
                                                       └─▶ lib/profile/store (local)

  contexts/AuthContext  ──▶ Supabase Auth REST (session/token authority; getToken())
  contexts/OnboardingContext ──▶ lib/onboarding/store        contexts/ImageContext ──▶ in-memory
```

### File inventory (27 modules, ~3,700 LOC)

| Layer | File | LOC | Role | Notes |
|---|---|---:|---|---|
| backend/ai | `gemini.ts` | 112 | Gemini REST client | **Server-only** (`GEMINI_API_KEY`) |
| backend/ai | `schema.ts` | 171 | Result validation/coercion | **Client-safe — must stay pure** |
| backend/ai | `prompt.ts` | 115 | Prompt construction | **Client-safe — must stay pure** |
| backend/ai | `precheck.ts` | 80 | Face precheck | **Dead** — `runFacePrecheck` called nowhere |
| backend/ai | `openai.ts` | 4 | OpenAI stub | **Dead** — OpenAI path retired |
| backend/api | `rateLimit.ts` | 82 | In-memory rate limiter | Used by route |
| backend/services | `analysisService.ts` | 111 | **Orchestration (model)** | validate → Gemini → coerce |
| backend/services | `README.md` | 26 | Layer convention doc | Defines "server-only service" rules |
| contexts | `AuthContext.tsx` | 375 | Session/token authority | Owns Supabase Auth REST; exposes `getToken()` |
| contexts | `ProfileContext.tsx` | 355 | Profile state **+ orchestration** | Load/migrate/persist routing inlined |
| contexts | `AnalysisResultContext.tsx` | 334 | Result state | Hand-rolled `sessionStorage` keys |
| contexts | `PortfolioContext.tsx` | 326 | Gallery state **+ orchestration** | Upload/migrate/signed-URL/rollback inlined |
| contexts | `OnboardingContext.tsx` | 150 | Onboarding state | Thin over `lib/onboarding/store` |
| contexts | `ImageContext.tsx` | 115 | In-memory image + preview URL | Appropriately thin |
| database/supabase | `db.ts` | 115 | `analyses` repository | Propagates errors (no try/catch) |
| database/supabase | `profileDb.ts` | 114 | `profiles` repository | try/catch → null; imports from `lib` |
| database/supabase | `storage.ts` | 113 | Storage REST helper | try/catch → null; imports from `lib` |
| database/supabase | `portfolioDb.ts` | 80 | `portfolio_items` repository | try/catch → null |
| database/supabase | `config.ts` | 74 | URLs + header builders | Centralized; **no shared fetch wrapper** |
| lib/history | `historyService.ts` | 172 | **Orchestration (exemplary)** | Composes db + storage + schema |
| lib/report | `report/model.ts` | 158 | Report view model | Pure transform |
| lib/portfolio | `portfolio/store.ts` | 142 | Local gallery store + downscale | `cryptoId`, `downscaleToDataUrl` |
| lib/profile | `profile/store.ts` | 123 | Local profile store | Dup `isFiniteInt`/`coerceDob` |
| lib/media | `media/image.ts` | 99 | Upload downscale + dataURL→Blob | `downscaleToBlob` (mirror of store's) |
| lib/onboarding | `onboarding/store.ts` | 88 | Local onboarding store | Dup `isFiniteInt`/`coerceDob` |
| lib/onboarding | `onboarding/date.ts` | 63 | DOB/date helpers | Pure |
| app/api | `analyze/route.ts` | — | Only API route | Thin adapter (`runtime = "nodejs"`) |

---

## 3. API-call inventory (where the network is touched)

Every outbound call is either the server-side Gemini call or a raw `fetch` against Supabase (PostgREST / Storage / Auth). **There is no SDK — the dependency-free `fetch` posture is deliberate.** All Supabase calls build their URL and headers from `database/supabase/config.ts` (`restBase`/`storageBase`/`authBase`, `baseHeaders`/`authedHeaders`/`storageHeaders`).

| Caller | Target | Calls |
|---|---|---|
| `backend/ai/gemini.ts` | `generativelanguage.googleapis.com` | **Only server-side external call.** Reached via `analysisService.analyzeImage` ← `route.ts`. |
| `database/supabase/db.ts` | PostgREST `…/rest/v1/analyses` | `insertAnalysisRow`, `listAnalysisRows`, `getAnalysisImagePath`, `deleteAnalysisRow` |
| `database/supabase/profileDb.ts` | PostgREST `…/rest/v1/profiles` | get + upsert (merge-duplicates) |
| `database/supabase/portfolioDb.ts` | PostgREST `…/rest/v1/portfolio_items` | list + insert + delete |
| `database/supabase/storage.ts` | Storage `…/storage/v1/object/*` | `uploadImage`, `createSignedUrl`, `deleteObject` (private `user-media` bucket) |
| `contexts/AuthContext.tsx` | Auth `…/auth/v1/*` | Session restore/refresh, email sign-in/up, Google OAuth; issues `getToken()` |

All client-side Supabase calls carry the signed-in user's bearer token and are confined by row-level security. `config.ts` documents the invariant: the anon key is public by design, and **no service-role key exists anywhere in the app**.

---

## 4. Business-logic locations

**Well-placed (the pattern to replicate).**
`analysisService.analyzeImage` (validate → Gemini → schema-coerce) and `historyService` (save-with-photo-upload-and-rollback, list, delete-with-object-cleanup) are model orchestration modules: they compose primitives and own the cross-resource control flow, leaving `route.ts` and the `*Db` repositories dumb. `route.ts` confirms the thin-adapter role — it owns only `RATE_LIMIT`/`RATE_WINDOW_MS`, multipart parsing, the `fail()` serializer, and delegation to `analyzeImage`.

**Inlined in contexts (primary extraction candidates).**

- **`PortfolioContext` (326 LOC)** carries the heaviest inlined orchestration in the codebase. Directly inside the provider: backend-mode selection (`modeRef`), the cloud load-or-migrate pipeline (lines ~96–181, including local→cloud upload+insert and adopting the newest photo as avatar), add-with-rollback (lines ~183–248), and delete/clear with Storage object cleanup (lines ~250–292). It imports and wires `portfolioDb`, `storage`, and `lib/portfolio/store` itself.
- **`ProfileContext` (355 LOC)** similarly inlines load/migrate/persist routing across `profileDb` and `lib/profile/store` (cloud-wins reconciliation, migrate-on-login, timestamp stamping).

**Hand-rolled inconsistency.**

- **`AnalysisResultContext` (334 LOC)** manages `sessionStorage` directly with literal keys `"alkline-analysis-result"` and `"alkline-analysis-persisted"` (lines 65–66) rather than delegating to a store module the way every other feature does. It also composes `historyService.listAnalyses` for cloud rehydration, so it mixes a proper service call with ad-hoc persistence.

**Appropriately thin (leave as-is).** `OnboardingContext` (over `lib/onboarding/store`), `ImageContext` (in-memory + object URL), and the bulk of `AuthContext` (which is legitimately the session/token authority) are already the right shape.

---

## 5. Duplication catalog

Concrete, verified duplication — each with a proposed single home.

1. **UUID generation — 2 implementations.** `cryptoId()` (`lib/portfolio/store.ts:18`) and `newId()` (`lib/history/historyService.ts:44`) both prefer `crypto.randomUUID()` with a `Math.random` fallback. → one `uuid()` primitive.

2. **Canvas downscale — 2 near-identical implementations.** `downscaleToDataUrl` (`lib/portfolio/store.ts:93`, emits a data URL via `canvas.toDataURL`) and `downscaleToBlob` (`lib/media/image.ts:24`, emits a Blob via `canvas.toBlob`). `image.ts`'s own header admits it "mirrors the portfolio store's `downscaleToDataUrl`." → one downscale core + two thin encoders (Blob / dataURL).

3. **`isFiniteInt` + `coerceDob` — byte-for-byte duplicate.** Identical in `lib/onboarding/store.ts:20–32` and `lib/profile/store.ts:35–47`. → one shared coercion (co-locate with `lib/onboarding/date.ts`).

4. **SSR-safe localStorage template — repeated 3×.** The `typeof window === "undefined"` guard + `try { JSON.parse(getItem) } catch { default }` load/save/clear shape recurs across `onboarding/store.ts`, `profile/store.ts`, and `portfolio/store.ts`. → a `createLocalStore(key, coerce)` factory.

5. **Supabase REST boilerplate — repeated per function.** `config.ts` centralizes URLs and headers but there is **no shared request wrapper**; every function in `db.ts`, `profileDb.ts`, `portfolioDb.ts`, and `storage.ts` re-implements `fetch` → `!res.ok` handling → `rows[0] ?? null`. Error handling is also **inconsistent**: `db.ts` deliberately lets errors propagate (documented, so the service owns the try/catch), while `profileDb`/`portfolioDb`/`storage` swallow to `null`/`false`. → a shared `sbFetch()`/`restRequest()` with one agreed error contract.

6. **Backend-mode reconciliation skeleton — repeated across contexts.** The "if signed-in → cloud (migrate on empty, cloud-wins), else local," the `getToken()` null-gating/degrade, and timestamp stamping all recur in both `PortfolioContext` and `ProfileContext`. → a shared `backendMode` helper used by the extracted services.

### Cross-layer import smells (dependency direction)

These imports run against the intended **backend → lib → database** layering and should be resolved as part of the plan:

- `database/supabase/storage.ts:2` imports `UPLOAD_CONTENT_TYPE` from `@/lib/media/image` (database → lib).
- `database/supabase/profileDb.ts:2` imports `coerceProfileData` from `@/lib/profile/store` (database → lib).
- `lib/history/historyService.ts:10` imports `coerceStoredResult` from `@/backend/ai/schema` (lib → backend). This one is benign given `schema.ts` is intentionally pure/client-safe, but it's worth recording.

### Dead / dormant code

- `backend/ai/openai.ts` (4 LOC stub) — the OpenAI path is retired.
- `backend/ai/precheck.ts` (80 LOC) — `runFacePrecheck` is called nowhere.

---

## 6. Invariants any refactor must preserve

These are load-bearing and easy to break unintentionally:

- **`schema.ts` and `prompt.ts` must stay client-safe/pure.** They're imported by client code (`AnalysisResultContext`, `historyService`); they must never gain server-only imports or a `"server-only"` marker.
- **`gemini.ts` stays server-only** (reads `GEMINI_API_KEY`, no `NEXT_PUBLIC_` prefix; `route.ts` pins `runtime = "nodejs"`).
- **No SDK, no new dependencies** — the raw-`fetch` posture is intentional.
- **No service-role key, ever** — all Supabase access stays anon-key + user token + RLS.
- **Routes/URLs unchanged** — public routes stay public, protected routes stay `RequireAuth`-gated.
- **Behavior parity** — these are refactors, not feature or contract changes.

---

## 7. Extraction plan (phased proposal)

Ordered lowest-risk-first. Each phase is independently shippable and gated by `tsc --noEmit` plus a behavior-parity check. No phase changes any route, URL, or external contract.

### Phase 0 — Retire dead code _(no behavior change)_
Delete (or, if you prefer a paper trail, mark clearly dormant) `backend/ai/openai.ts` and `backend/ai/precheck.ts`. Removes ~84 LOC of confusion and shrinks the surface future readers must reason about.

### Phase 1 — Consolidate pure primitives _(no behavior change, no I/O)_
Highest value-to-risk ratio; touches only leaf modules.

1. One `uuid()` primitive (in `lib/media` or a small `lib/id`); `portfolio/store` and `historyService` import it. Removes duplication #1.
2. One canvas-downscale core in `lib/media/image.ts`; express `downscaleToBlob` and `downscaleToDataUrl` as thin `toBlob`/`toDataURL` wrappers over it. Removes duplication #2.
3. Move `isFiniteInt` + `coerceDob` to a shared home (alongside `lib/onboarding/date.ts`); both stores import it. Removes duplication #3.
4. Introduce `createLocalStore(key, coerce)` and refactor the three local stores onto it. Removes duplication #4.

### Phase 2 — Consolidate the data-access seam _(repository layer)_
1. Add a shared `sbFetch()`/`restRequest()` in `database/supabase` that wraps `fetch` + `config.ts` headers + `!res.ok` handling + JSON/`rows[0]` extraction. Refactor `db.ts`, `profileDb.ts`, `portfolioDb.ts`, `storage.ts` onto it. Removes duplication #5.
2. **Decide one error contract** for repositories (recommend: repositories propagate, services own try/catch — the `db.ts` + `historyService` model — so error handling lives in exactly one layer) and apply it uniformly.
3. Resolve the cross-layer imports: relocate `UPLOAD_CONTENT_TYPE` to a neutral constant so `storage.ts` no longer imports from `lib`, and decide the correct home for `coerceProfileData` (repository mapper vs. lib store).

### Phase 3 — Extract context orchestration _(largest behavioral surface; depends on 1–2)_
Give the contexts the same thin-shell shape `historyService` already models.
1. Extract a `portfolioService` (client-side, in `lib/portfolio`) owning the cloud/local pipeline — load+migrate, add-with-rollback, remove/clear-with-cleanup. `PortfolioContext` becomes thin React state over it.
2. Extract a `profileService` for load/migrate/persist routing; `ProfileContext` becomes thin state over it.
3. Give `AnalysisResultContext` a real store module (a `sessionStorage` variant of `createLocalStore`) instead of the literal `"alkline-…"` keys, so it matches every other feature.
4. Factor the shared `backendMode` reconciliation helper (duplication #6) and have both new services use it.

### Phase 4 — Verify
After **each** phase: `tsc --noEmit` clean; no route/URL diffs; client-safe modules still client-safe (no `server-only` leakage into `schema.ts`/`prompt.ts`); no new dependencies; anon-key/RLS posture unchanged; spot-check behavior parity on the scan → save → history and portfolio upload/migrate flows.

### Rationale for the ordering
Phase 1 is pure and carries almost no risk, so it can land immediately and independently. Phase 2 touches the repository seam but preserves every call site's contract. Phase 3 is the biggest change (contexts drive live UI state) and genuinely benefits from the primitives and the request wrapper existing first. Splitting it this way keeps every step small enough to verify against a clean typecheck and a quick manual pass.
