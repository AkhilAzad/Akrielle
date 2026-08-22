import { restBase, authedHeaders } from "@/lib/supabase/config";
import { coerceStoredResult } from "@/lib/analysis/schema";
import type { AnalysisResult } from "@/context/AnalysisResultContext";
import type { SavedAnalysis } from "@/types/account";

/**
 * Dependency-free data access over Supabase's PostgREST API. Every call is
 * authenticated with the user's access token; row-level security on the
 * `analyses` table guarantees a user can only ever read or delete their own
 * rows (see SUPABASE_SETUP.md for the schema + policies).
 *
 * Only the analysis result + score are stored — never the uploaded photo —
 * which keeps the product's "images are never stored permanently" promise.
 */

const TABLE = "analyses";

interface AnalysisRow {
  id: string;
  created_at: string;
  beauty_score: number;
  result: unknown;
}

// Re-validate rows coming back from the database. Stored payloads were coerced
// at save time, but re-running the repair guarantees the results/report UI —
// which reads fields like `faceShape.toLowerCase()` directly — can never crash
// on an old-schema or corrupted row. The score badge is derived from the same
// repaired result so it can't render NaN either.
function toSaved(row: AnalysisRow): SavedAnalysis {
  const result = coerceStoredResult(row.result);
  return {
    id: row.id,
    createdAt: row.created_at,
    beautyScore: Math.round(result.beautyScore),
    result,
  };
}

/**
 * Persist a completed analysis for the signed-in user. `user_id` is filled
 * in by a column default (`auth.uid()`) and enforced by RLS, so it isn't
 * sent from the client. Returns the saved row, or null on failure.
 */
export async function saveAnalysis(
  accessToken: string,
  result: AnalysisResult
): Promise<SavedAnalysis | null> {
  try {
    const res = await fetch(`${restBase()}/${TABLE}`, {
      method: "POST",
      headers: authedHeaders(accessToken, { Prefer: "return=representation" }),
      body: JSON.stringify({
        beauty_score: Math.round(result.beautyScore),
        result,
      }),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as AnalysisRow[];
    return Array.isArray(rows) && rows[0] ? toSaved(rows[0]) : null;
  } catch {
    return null;
  }
}

/** List the signed-in user's saved analyses, newest first. */
export async function listAnalyses(
  accessToken: string
): Promise<SavedAnalysis[]> {
  try {
    const query =
      "select=id,created_at,beauty_score,result&order=created_at.desc";
    const res = await fetch(`${restBase()}/${TABLE}?${query}`, {
      method: "GET",
      headers: authedHeaders(accessToken),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as AnalysisRow[];
    return Array.isArray(rows) ? rows.map(toSaved) : [];
  } catch {
    return [];
  }
}

/** Delete one of the signed-in user's saved analyses. */
export async function deleteAnalysis(
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
