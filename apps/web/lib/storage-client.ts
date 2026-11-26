import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  DOCUMENT_BUCKET,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_TYPES,
  avatarPathFromPublicUrl,
  buildAvatarPath,
  buildDocumentPath,
  displayNameFromObjectName,
  validateFile,
} from "./storage";

// Upload / download / delete steps for the Your Profile page. The Supabase
// client is passed in rather than imported, so every step and every failure
// path can be tested with a fake client.

export type DocItem = {
  path: string;
  name: string;
  size: number | null;
  createdAt: string | null;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export async function uploadAvatar(
  supabase: SupabaseClient,
  args: { userId: string; file: File; previousUrl: string | null }
): Promise<Result<string>> {
  const problem = validateFile(args.file, AVATAR_TYPES, AVATAR_MAX_BYTES);
  if (problem) return { ok: false, error: problem };

  const path = buildAvatarPath(args.userId, args.file.type, Date.now());
  const bucket = supabase.storage.from(AVATAR_BUCKET);

  const uploaded = await bucket.upload(path, args.file, {
    contentType: args.file.type,
    cacheControl: "3600",
  });
  if (uploaded.error) {
    return { ok: false, error: `Couldn't upload your picture (${uploaded.error.message}).` };
  }

  const publicUrl = bucket.getPublicUrl(path).data.publicUrl;

  // .select() makes Postgres return the rows it changed. Row-Level Security
  // can silently change ZERO rows without raising an error, so we check.
  const saved = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", args.userId)
    .select("id");
  if (saved.error || !saved.data || saved.data.length !== 1) {
    await bucket.remove([path]); // don't leave an orphaned file behind
    return {
      ok: false,
      error:
        "Your picture uploaded but couldn't be saved to your profile, so it was discarded. Please try again.",
    };
  }

  // Tidy up the previous picture (best effort — failing here is harmless).
  const oldPath = args.previousUrl ? avatarPathFromPublicUrl(args.previousUrl) : null;
  if (oldPath && oldPath !== path) await bucket.remove([oldPath]);

  return { ok: true, value: publicUrl };
}

export async function listDocuments(
  supabase: SupabaseClient,
  businessId: string
): Promise<Result<DocItem[]>> {
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).list(businessId, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return { ok: false, error: "We couldn't load your documents." };

  const items = (data ?? [])
    .filter((o) => o.id !== null && !o.name.startsWith("."))
    .map((o) => ({
      path: `${businessId}/${o.name}`,
      name: displayNameFromObjectName(o.name),
      size: typeof o.metadata?.size === "number" ? (o.metadata.size as number) : null,
      createdAt: o.created_at ?? null,
    }));
  return { ok: true, value: items };
}

export async function uploadDocument(
  supabase: SupabaseClient,
  args: { businessId: string; file: File; now?: number }
): Promise<Result<DocItem>> {
  const { businessId, file } = args;
  const problem = validateFile(file, DOCUMENT_TYPES, DOCUMENT_MAX_BYTES);
  if (problem) return { ok: false, error: problem };

  const path = buildDocumentPath(businessId, file.name, args.now ?? Date.now());
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) return { ok: false, error: `${file.name}: couldn't upload (${error.message}).` };

  return {
    ok: true,
    value: {
      path,
      name: displayNameFromObjectName(path.slice(businessId.length + 1)),
      size: file.size,
      createdAt: new Date().toISOString(),
    },
  };
}

/** Private files are opened through a short-lived (60 second) signed link. */
export async function createDownloadUrl(
  supabase: SupabaseClient,
  doc: DocItem
): Promise<Result<string>> {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.path, 60, { download: doc.name });
  if (error || !data?.signedUrl) {
    return { ok: false, error: `Couldn't prepare ${doc.name} for download.` };
  }
  return { ok: true, value: data.signedUrl };
}

export async function deleteDocument(
  supabase: SupabaseClient,
  doc: DocItem
): Promise<Result<true>> {
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).remove([doc.path]);
  // An empty result means nothing was deleted (not found, or not allowed).
  if (error || !data || data.length === 0) {
    return { ok: false, error: `Couldn't delete ${doc.name}.` };
  }
  return { ok: true, value: true };
}
