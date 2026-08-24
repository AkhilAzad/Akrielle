# Backend Services

Reserved for **server-only** service modules — code that must never ship to the
browser (secret-bearing integrations, third-party API clients, orchestration
logic that composes the AI and database layers).

## What belongs here

- Wrappers around external APIs that require secret keys (e.g. a future billing
  provider, email service, or a server-side analytics sink).
- Orchestration/service functions called **only** from Route Handlers in
  `src/app/api/**` or from Server Components — never imported by a Client
  Component (`"use client"`).

## What does NOT belong here

- The AI request/response logic → `src/backend/ai/`
- HTTP concerns like rate limiting → `src/backend/api/`
- Anything the browser imports (auth session helpers, DB REST callers that run
  in the client) → `src/auth/`, `src/database/`, or `src/lib/`

## Convention

Each service should export a small, typed surface and keep Next.js server
boundaries intact. If a module reads `process.env` secrets (no `NEXT_PUBLIC_`
prefix) or must run in the Node.js runtime, it lives here.
