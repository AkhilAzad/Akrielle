import { restBase, authedHeaders } from "@/lib/supabase/config";

/**
 * Dependency-free access to the per-user `portfolio_items` rows over PostgREST.
 * Each row is just metadata + a pointer at an object in the `user-media`
 * Storage bucket — the image bytes live in Storage, never in the database.
 *
 * Row-level security scopes every read/write to the signed-in user; `user_id`
 * is filled by a column default (`auth.uid()`) and never sent by the client.
 */

const TABLE = "portfolio_items";

/** The raw database row for one saved photo. */
export interface PortfolioRow {
  id: string;
  storage_path: string;
  name: string | null;
  added_at: string;
}

/** List the signed-in user's portfolio rows, newest first. */
export async function listPortfolioRows(
  accessToken: string
): Promise<PortfolioRow[]> {
  try {
    const query =
      "select=id,storage_path,name,added_at&order=added_at.desc";
    const res = await fetch(`${restBase()}/${TABLE}?${query}`, {
      method: "GET",
      headers: authedHeaders(accessToken),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as PortfolioRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/** Insert one portfolio row pointing at an already-uploaded Storage object. */
export async function insertPortfolioRow(
  accessToken: string,
  input: { storage_path: string; name: string }
): Promise<PortfolioRow | null> {
  try {
    const res = await fetch(`${restBase()}/${TABLE}`, {
      method: "POST",
      headers: authedHeaders(accessToken, { Prefer: "return=representation" }),
      body: JSON.stringify({
        storage_path: input.storage_path,
        name: input.name,
      }),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as PortfolioRow[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

/** Delete one of the signed-in user's portfolio rows. */
export async function deletePortfolioRow(
  accessToken: string,
  id: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${restBase()}/${TABLE}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: authedHeaders(accessToken),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
