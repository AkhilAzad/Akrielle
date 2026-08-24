import { restBase, authedHeaders } from "@/database/supabase/config";

/**
 * Pure, dependency-free data access over Supabase's PostgREST API for the
 * `analyses` table. Every call is authenticated with the user's access token;
 * row-level security guarantees a user can only ever read or delete their own
 * rows (see supabase/schema.sql for the schema + policies).
 *
 * This module is a thin repository: one request per function, returning raw
 * rows or HTTP outcomes and nothing more. All cross-resource behavior — the
 * opt-in scan-photo upload, rollback, delete-with-cleanup, and schema
 * coercion — lives in the history service (@/lib/history/historyService),
 * which composes these accessors with Storage. Keeping this file pure lets it
 * stay a single-resource accessor with no Storage or domain dependencies.
 *
 * These functions let network errors propagate to their caller (the service),
 * which owns the try/catch that turns failures into safe return values. This
 * preserves the exact control flow the combined db.ts had previously.
 */

const TABLE = "analyses";

/** A raw `analyses` row as returned by PostgREST. */
export interface AnalysisRow {
  id: string;
  created_at: string;
  beauty_score: number;
  result: unknown;
}

/** The columns written when inserting an analysis row. */
export interface InsertAnalysisInput {
  beauty_score: number;
  result: unknown;
  /** Set only when a scan photo was stored; otherwise the column default applies. */
  id?: string;
  /** Set only when a scan photo was stored. */
  image_path?: string;
}

/**
 * Outcome of an insert. `ok` mirrors the HTTP status so the caller can decide
 * what to do on failure (e.g. roll back an uploaded photo); `row` is the
 * `return=representation` row when one came back.
 */
export interface InsertAnalysisResult {
  ok: boolean;
  row: AnalysisRow | null;
}

/**
 * Insert an analysis row for the signed-in user. `user_id` is filled in by a
 * column default (`auth.uid()`) and enforced by RLS, so it isn't sent from the
 * client. Returns the HTTP outcome plus the representation row (when present).
 */
export async function insertAnalysisRow(
  accessToken: string,
  body: InsertAnalysisInput
): Promise<InsertAnalysisResult> {
  const res = await fetch(`${restBase()}/${TABLE}`, {
    method: "POST",
    headers: authedHeaders(accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, row: null };
  const rows = (await res.json()) as AnalysisRow[];
  return { ok: true, row: Array.isArray(rows) && rows[0] ? rows[0] : null };
}

/** List the signed-in user's analysis rows, newest first. */
export async function listAnalysisRows(
  accessToken: string
): Promise<AnalysisRow[]> {
  const query =
    "select=id,created_at,beauty_score,result&order=created_at.desc";
  const res = await fetch(`${restBase()}/${TABLE}?${query}`, {
    method: "GET",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as AnalysisRow[];
  return Array.isArray(rows) ? rows : [];
}

/**
 * Look up the stored scan-photo path for one row, or null when there is none
 * (or the lookup returns a non-OK status).
 */
export async function getAnalysisImagePath(
  accessToken: string,
  id: string
): Promise<string | null> {
  const res = await fetch(
    `${restBase()}/${TABLE}?id=eq.${encodeURIComponent(id)}&select=image_path`,
    { method: "GET", headers: authedHeaders(accessToken) }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as { image_path?: string | null }[];
  return rows[0]?.image_path ?? null;
}

/** Delete one analysis row by id (RLS-protected). Returns the HTTP success. */
export async function deleteAnalysisRow(
  accessToken: string,
  id: string
): Promise<boolean> {
  const res = await fetch(
    `${restBase()}/${TABLE}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: authedHeaders(accessToken),
    }
  );
  return res.ok;
}
