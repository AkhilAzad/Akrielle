# Supabase setup — Alkline accounts & history

This guide connects Alkline to a Supabase project so visitors can create an
account and keep a private history of their beauty analyses.

**You only need to do this once.** Until it's done, the app runs perfectly in
*anonymous mode*: scanning, results, and the PDF report all work — the only
thing missing is sign-in and saved history. The app detects whether Supabase
is configured and hides all the account UI automatically when it isn't.

**Privacy note:** only the analysis *result* and score are ever stored — never
the uploaded photo.

---

## What you'll end up with

- A `analyses` table locked down with row-level security (each user sees only
  their own rows).
- Email + password sign-in, and "Continue with Google".
- Two values pasted into `.env.local`.

The app uses **only the public anon key**, protected by row-level security.
There is no service-role key anywhere in the codebase.

---

## Step 1 — Create a Supabase project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**. Pick a name (e.g. `alkline`), a strong database
   password, and a region close to your users.
3. Wait ~2 minutes for it to finish provisioning.

## Step 2 — Create the table + security policies

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this repo, copy its entire contents, paste
   into the editor, and click **Run**.
3. You should see "Success. No rows returned." That created the `analyses`
   table, its index, and three row-level-security policies (read / insert /
   delete your own rows only).

You can confirm it worked under **Table Editor** → `analyses`, and under
**Authentication → Policies** (you'll see the three policies listed).

## Step 3 — Copy your API credentials into `.env.local`

1. Open **Project Settings** (gear icon) → **API**.
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Project API keys → `anon` `public`** — a long token
3. In this repo, open `.env.local` and fill in the two placeholders:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   > Both values are meant to be public and shipped to the browser — that's
   > why they're prefixed `NEXT_PUBLIC_`. They're safe to expose because
   > row-level security is what actually protects the data.

## Step 4 — Set the auth redirect URLs

The app finishes Google sign-in at the route `/auth/callback`, so Supabase must
be told those URLs are allowed.

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to where you run the app:
   - Local development: `http://localhost:3000`
   - Production: your real domain, e.g. `https://alkline.com`
3. Under **Redirect URLs**, add every environment you'll sign in from,
   each with the `/auth/callback` path:
   - `http://localhost:3000/auth/callback`
   - `https://alkline.com/auth/callback` (once you deploy)

## Step 5 — Enable Email sign-in

1. Open **Authentication → Providers → Email**. It's on by default.
2. Decide on **Confirm email**:
   - **On** (default): new users get a confirmation email before they can sign
     in. The app handles this — it shows a "check your email to confirm"
     message after sign-up.
   - **Off**: sign-up logs the user straight in. Convenient while developing;
     turn confirmation back on for production.

## Step 6 — Enable Google sign-in

This has two halves — a Google side and a Supabase side.

**In Google Cloud Console** (<https://console.cloud.google.com/>):

1. Create (or pick) a project → **APIs & Services → Credentials**.
2. Configure the **OAuth consent screen** if prompted (External; add your
   email as a test user while in testing).
3. **Create Credentials → OAuth client ID → Web application**.
4. Under **Authorized redirect URIs**, add your Supabase callback — note this
   is Supabase's URL, *not* the app's:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   (Find `<your-project-ref>` in your Project URL from Step 3.)
5. Save, then copy the generated **Client ID** and **Client secret**.

**In Supabase** (**Authentication → Providers → Google**):

1. Toggle Google **on**.
2. Paste the **Client ID** and **Client secret** from Google.
3. Save.

## Step 7 — Restart and verify

1. Stop the dev server if it's running, then start it again so Next.js picks up
   the new env vars:

   ```bash
   npm run dev
   ```

2. Load the site. You should now see **Sign in** in the header.
3. Create an account (or use Google), run a scan, and open **Account** — the
   analysis should appear in your history. Delete it to confirm that works too.

---

## Troubleshooting

- **No "Sign in" link appears.** The app thinks Supabase isn't configured.
  Re-check that both `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local` and that you
  restarted the dev server.
- **Google sign-in returns an error / redirect mismatch.** The redirect URI in
  Google Cloud must be exactly `https://<project-ref>.supabase.co/auth/v1/callback`,
  and the app's own URL (`.../auth/callback`) must be listed under Supabase
  **Redirect URLs** (Step 4).
- **Signed in, but history is always empty / saves fail.** Make sure the
  Step 2 SQL actually ran (Table Editor shows an `analyses` table with RLS
  enabled and three policies).
- **"Check your email" after signing up and nothing else happens.** Email
  confirmation is on (Step 5). Confirm via the email, or turn confirmation off
  for development.

## How the app behaves when this isn't set up

Everything except accounts works. Scanning, results, and the report are never
gated. The account link, sign-in page, and "save to history" banner all stay
hidden until Supabase is configured — so shipping without accounts is a valid
state, not a broken one.
