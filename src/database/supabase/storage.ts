import { storageBase, storageHeaders } from "@/database/supabase/config";
import { UPLOAD_CONTENT_TYPE } from "@/lib/media/image";

/**
 * Dependency-free access to Supabase Storage over its REST API — no SDK.
 *
 * Every call is authenticated with the signed-in user's access token; policies
 * on `storage.objects` (see supabase/schema.sql) confine each user to their own
 * top-level folder, whose name is their auth user id. So all object paths here
 * MUST begin with `<userId>/…` or the request will be rejected by RLS.
 *
 * The `user-media` bucket is PRIVATE: images are shown via short-lived signed
 * URLs (`createSignedUrl`), never public links.
 */

/** The single private bucket that holds every user image. */
export const MEDIA_BUCKET = "user-media";

/**
 * Encode an object path for a URL without touching the "/" separators — the
 * key genuinely contains slashes (`<userId>/portfolio/<id>.jpg`). Segments are
 * individually escaped so a stray character can't break the URL.
 */
function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** Build the folder prefix (`<userId>/`) all of a user's objects live under. */
export function userFolder(userId: string): string {
  return `${userId}/`;
}

/**
 * Upload (or overwrite) an object at `path`. Returns the stored key on success,
 * or null on failure. `path` must start with the owner's user id.
 */
export async function uploadImage(
  accessToken: string,
  path: string,
  blob: Blob,
  contentType: string = UPLOAD_CONTENT_TYPE
): Promise<string | null> {
  try {
    const res = await fetch(
      `${storageBase()}/object/${MEDIA_BUCKET}/${encodePath(path)}`,
      {
        method: "POST",
        // x-upsert lets a re-save (e.g. replacing an avatar) overwrite cleanly.
        headers: storageHeaders(accessToken, contentType, { "x-upsert": "true" }),
        body: blob,
      }
    );
    if (!res.ok) return null;
    return path;
  } catch {
    return null;
  }
}

/**
 * Create a short-lived signed URL for a private object, or null on failure.
 * The Storage API returns a relative path (`/object/sign/...`), which we
 * resolve against the Storage base into a full, fetchable URL.
 */
export async function createSignedUrl(
  accessToken: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const res = await fetch(
      `${storageBase()}/object/sign/${MEDIA_BUCKET}/${encodePath(path)}`,
      {
        method: "POST",
        headers: storageHeaders(accessToken, "application/json"),
        body: JSON.stringify({ expiresIn }),
      }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      signedURL?: string;
      signedUrl?: string;
    };
    const signed = body.signedURL ?? body.signedUrl;
    if (typeof signed !== "string" || signed.length === 0) return null;
    // The API returns a path beginning with "/object/sign/…"; make it absolute.
    return signed.startsWith("http") ? signed : `${storageBase()}${signed}`;
  } catch {
    return null;
  }
}

/** Delete an object. Best-effort — returns false on failure (never throws). */
export async function deleteObject(
  accessToken: string,
  path: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${storageBase()}/object/${MEDIA_BUCKET}/${encodePath(path)}`,
      {
        method: "DELETE",
        headers: storageHeaders(accessToken),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
