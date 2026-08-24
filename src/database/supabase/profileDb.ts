import { restBase, authedHeaders } from "@/database/supabase/config";
import { coerceProfileData } from "@/lib/profile/store";
import type { ProfileData } from "@/types/profile";
import type { DobValue } from "@/types/onboarding";

/**
 * Dependency-free access to the per-user `profiles` row over PostgREST — the
 * same posture as lib/supabase/db.ts. Row-level security guarantees a user can
 * only read or write their OWN row; `user_id` is filled by a column default
 * (`auth.uid()`) and never sent from the client.
 *
 * The row mirrors the app's ProfileData (small JSONB sub-objects) plus a
 * display name, date of birth, and an optional avatar image path in Storage.
 */

const TABLE = "profiles";

/** The raw database row (snake_case, JSONB columns arrive as parsed objects). */
export interface ProfileRow {
  user_id: string;
  display_name: string | null;
  dob: DobValue | null;
  personal: unknown;
  appearance: unknown;
  beauty: unknown;
  app: unknown;
  avatar_path: string | null;
  updated_at: string | null;
}

/**
 * The writable columns of an upsert. All optional so callers can patch a single
 * field (e.g. just `avatar_path`) without clobbering the rest — PostgREST's
 * merge-duplicates only updates the columns present in the body. `user_id` is
 * intentionally absent (server default + RLS).
 */
export interface ProfileWritable {
  display_name?: string | null;
  dob?: DobValue | null;
  personal?: ProfileData["personal"];
  appearance?: ProfileData["appearance"];
  beauty?: ProfileData["beauty"];
  app?: ProfileData["app"];
  avatar_path?: string | null;
  updated_at?: string;
}

/** Map a database row into the app's ProfileData (re-coerced for safety). */
export function rowToProfileData(row: ProfileRow): ProfileData {
  return coerceProfileData({
    displayName: row.display_name ?? "",
    dob: row.dob ?? null,
    personal: row.personal,
    appearance: row.appearance,
    beauty: row.beauty,
    app: row.app,
    updatedAt: row.updated_at ?? null,
  });
}

/** Map ProfileData into a full upsert body (everything except the avatar). */
export function profileDataToWritable(data: ProfileData): ProfileWritable {
  return {
    display_name: data.displayName.trim() ? data.displayName : null,
    dob: data.dob,
    personal: data.personal,
    appearance: data.appearance,
    beauty: data.beauty,
    app: data.app,
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };
}

/** Fetch the signed-in user's profile row, or null if they don't have one. */
export async function fetchProfileRow(
  accessToken: string
): Promise<ProfileRow | null> {
  try {
    const res = await fetch(`${restBase()}/${TABLE}?select=*`, {
      method: "GET",
      headers: authedHeaders(accessToken),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as ProfileRow[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

/**
 * Insert-or-update the signed-in user's profile row. Uses PostgREST upsert on
 * the `user_id` primary key with merge-duplicates, so a first write creates the
 * row and later writes patch only the supplied columns. Returns the saved row.
 */
export async function upsertProfileRow(
  accessToken: string,
  patch: ProfileWritable
): Promise<ProfileRow | null> {
  try {
    const res = await fetch(`${restBase()}/${TABLE}?on_conflict=user_id`, {
      method: "POST",
      headers: authedHeaders(accessToken, {
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(patch),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as ProfileRow[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}
