import { restBase, authedHeaders } from "@/database/supabase/config";
import { uploadImage, deleteObject } from "@/database/supabase/storage";
import { coerceStoredResult } from "@/backend/ai/schema";
import type { AnalysisResult } from "@/contexts/AnalysisResultContext";
import type { SavedAnalysis } from "@/types/account";

/**
 * Dependency-free data access over Supabase's PostgREST API. Every call is
 * authenticated with the user's access token; row-level security on the
 * `analyses` table guarantees a user can only ever read or delete their own
 * rows (see supabase/schema.sql for the schema + policies).
 *
 * By default only the analysis result + score are stored — never the photo.
 * A signed-in user who has turned on "save photos" can opt to also keep the
 * scan image: it's uploaded to the private `user-media` Storage bucket and the
 * row records its path in `image_path`. Anonymous scans store nothing at all.
 */

const TABLE = "analyses";

/**
 * A client-generated UUID, used when we must name a Storage object before the
 * row exists (upload-then-insert). Prefers the platform `crypto.randomUUID`,
 * with a Math.random fallback that's fine for a per-user storage key.
 */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

/** Options for persisting a scan, including the opt-in photo upload. */
export interface SaveAnalysisOptions {
  /**
   * A downscaled scan photo to store. Only provided when the signed-in user
   * has "save photos" on. Uploaded before the row is inserted.
   */
  imageBlob?: Blob | null;
  /** The signed-in user's id — namespaces the Storage object (`<id>/scans/…`). */
  userId?: string | null;
}

/**
 * Persist a completed analysis for the signed-in user. `user_id` is filled
 * in by a column default (`auth.uid()`) and enforced by RLS, so it isn't
 * sent from the client. Returns the saved row, or null on failure.
 *
 * When an opt-in `imageBlob` (+ `userId`) is supplied, the photo is uploaded
 * FIRST under a client-generated id, then the row is inserted carrying that id
 * and its `image_path`. Uploading first avoids a second UPDATE round-trip (and
 * any update policy); if the upload fails we still save the analysis, just
 * without the photo — a photo hiccup never costs the user their history entry.
 */
export async function saveAnalysis(
  accessToken: string,
  result: AnalysisResult,
  opts: SaveAnalysisOptions = {}
): Promise<SavedAnalysis | null> {
  try {
    let id: string | undefined;
    let imagePath: string | null = null;
    if (opts.imageBlob && opts.userId) {
      const candidateId = newId();
      const path = `${opts.userId}/scans/${candidateId}.jpg`;
      const uploaded = await uploadImage(accessToken, path, opts.imageBlob);
      if (uploaded) {
        id = candidateId;
        imagePath = path;
      }
    }

    const body: Record<string, unknown> = {
      beauty_score: Math.round(result.beautyScore),
      result,
    };
    // Only set these when a photo was actually stored; otherwise let the row's
    // id default (gen_random_uuid) apply and leave image_path NULL.
    if (id) body.id = id;
    if (imagePath) body.image_path = imagePath;

    const res = await fetch(`${restBase()}/${TABLE}`, {
      method: "POST",
      headers: authedHeaders(accessToken, { Prefer: "return=representation" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Row insert failed — roll back any object we just uploaded so a retry
      // (which uploads under a fresh id) doesn't leave the bucket accumulating
      // orphaned scan photos.
      if (imagePath) await deleteObject(accessToken, imagePath);
      return null;
    }
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

/**
 * Delete one of the signed-in user's saved analyses — and its stored scan
 * photo, if any, so deleting history truly removes everything (keeping the
 * privacy-page promise honest). The photo is looked up first, the row is
 * deleted (RLS-protected), then the private object is cleaned up best-effort.
 */
export async function deleteAnalysis(
  accessToken: string,
  id: string
): Promise<boolean> {
  try {
    // Look up any stored scan photo before the row is gone.
    let imagePath: string | null = null;
    try {
      const lookup = await fetch(
        `${restBase()}/${TABLE}?id=eq.${encodeURIComponent(
          id
        )}&select=image_path`,
        { method: "GET", headers: authedHeaders(accessToken) }
      );
      if (lookup.ok) {
        const rows = (await lookup.json()) as { image_path?: string | null }[];
        imagePath = rows[0]?.image_path ?? null;
      }
    } catch {
      // Non-fatal — proceed with the row delete regardless.
    }

    const res = await fetch(
      `${restBase()}/${TABLE}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: authedHeaders(accessToken),
      }
    );
    if (!res.ok) return false;
    // Row is gone; remove the private image too (best-effort).
    if (imagePath) await deleteObject(accessToken, imagePath);
    return true;
  } catch {
    return false;
  }
}
