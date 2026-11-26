// Constants and pure helpers for file uploads. Nothing here touches the
// network, so every rule can be tested without a browser or a database.

export const AVATAR_BUCKET = "avatars";
export const DOCUMENT_BUCKET = "documents";

// Keep these in sync with supabase/migrations/0002_storage.sql. The buckets
// enforce the same limits on the server; checking here just gives a friendly
// message before any upload starts.
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const DOCUMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeLabels(types: string[]): string {
  return types.map((t) => (EXTENSION_BY_TYPE[t] ?? t).toUpperCase()).join(", ");
}

/** Returns a user-facing problem, or null if the file is fine to upload. */
export function validateFile(
  file: { name: string; type: string; size: number },
  allowedTypes: string[],
  maxBytes: number
): string | null {
  if (file.size === 0) return `${file.name} is empty.`;
  if (!allowedTypes.includes(file.type)) {
    return `${file.name}: only ${typeLabels(allowedTypes)} files are allowed.`;
  }
  if (file.size > maxBytes) {
    return `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(maxBytes)}.`;
  }
  return null;
}

/**
 * Turns any file name into one that is safe as a storage key: no folders, no
 * spaces or symbols, ASCII only, capped length. Always returns something.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot + 1) : "";
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[_.-]+|[_.-]+$/g, "");
  const safeStem = clean(stem).slice(0, 80) || "file";
  const safeExt = clean(ext).toLowerCase().slice(0, 8);
  return safeExt ? `${safeStem}.${safeExt}` : safeStem;
}

/** Documents live at <businessId>/<timestamp>-<safe name>. */
export function buildDocumentPath(businessId: string, fileName: string, now: number): string {
  return `${businessId}/${now}-${sanitizeFileName(fileName)}`;
}

/** Strips the timestamp prefix added by buildDocumentPath for display. */
export function displayNameFromObjectName(objectName: string): string {
  return objectName.replace(/^\d{10,}-/, "");
}

/** Avatars live at <userId>/<timestamp>.<ext>. */
export function buildAvatarPath(userId: string, mimeType: string, now: number): string {
  return `${userId}/${now}.${EXTENSION_BY_TYPE[mimeType] ?? "png"}`;
}

const PUBLIC_AVATAR_MARKER = `/storage/v1/object/public/${AVATAR_BUCKET}/`;

/** Extracts the storage path from one of our public avatar URLs, else null. */
export function avatarPathFromPublicUrl(url: string): string | null {
  const i = url.indexOf(PUBLIC_AVATAR_MARKER);
  if (i === -1) return null;
  try {
    const path = decodeURIComponent(
      url.slice(i + PUBLIC_AVATAR_MARKER.length).split("?")[0]
    );
    return path || null;
  } catch {
    return null;
  }
}

/**
 * A profile's avatar_url is a column the user can edit, so only render it
 * if it really points at our own avatar bucket (not an arbitrary website).
 */
export function isOwnAvatarUrl(url: string, supabaseUrl: string): boolean {
  if (!supabaseUrl) return false;
  return url.startsWith(`${supabaseUrl.replace(/\/$/, "")}${PUBLIC_AVATAR_MARKER}`);
}
