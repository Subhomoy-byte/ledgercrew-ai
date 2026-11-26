"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { formatBytes, isOwnAvatarUrl } from "@/lib/storage";
import {
  createDownloadUrl,
  deleteDocument,
  listDocuments,
  uploadAvatar,
  uploadDocument,
  type DocItem,
} from "@/lib/storage-client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CONFIGURED = Boolean(SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "📕";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "🖼️";
  return "📎";
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Field({
  label,
  defaultValue,
  readOnly,
}: {
  label: string;
  defaultValue: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
        {label}
      </label>
      <input
        type="text"
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={`w-full rounded-[10px] border border-line px-3.5 py-[11px] text-[13.5px] outline-none transition focus:border-amber ${
          readOnly ? "bg-surface-2 text-ink-soft" : "bg-bg text-ink"
        }`}
      />
    </div>
  );
}

export default function ProfilePage() {
  // The Supabase client is created in the browser only (never during
  // server rendering).
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(CONFIGURED);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (CONFIGURED) setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !auth.user) {
        setLoadError("We couldn't confirm who you are. Please sign in again.");
        setLoading(false);
        return;
      }
      setUserId(auth.user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("business_id, avatar_url")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profileError) {
        setLoadError("We couldn't load your profile.");
        setLoading(false);
        return;
      }

      setAvatarUrl(profile?.avatar_url ?? null);
      const bid: string | null = profile?.business_id ?? null;
      setBusinessId(bid);

      if (bid) {
        const listed = await listDocuments(supabase, bid);
        if (cancelled) return;
        if (listed.ok) setDocs(listed.value);
        else setDocError(listed.error);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase || !userId) return;
    setAvatarBusy(true);
    setAvatarError(null);
    const result = await uploadAvatar(supabase, { userId, file, previousUrl: avatarUrl });
    setAvatarBusy(false);
    if (result.ok) setAvatarUrl(result.value);
    else setAvatarError(result.error);
  }

  async function handleUploadFiles(files: File[]) {
    if (!supabase || !businessId || files.length === 0) return;
    setUploading(true);
    setDocError(null);
    const problems: string[] = [];
    for (const file of files) {
      const result = await uploadDocument(supabase, { businessId, file });
      if (result.ok) setDocs((prev) => [result.value, ...prev]);
      else problems.push(result.error);
    }
    setUploading(false);
    if (problems.length > 0) setDocError(problems.join(" "));
  }

  async function handleDownload(doc: DocItem) {
    if (!supabase) return;
    setBusyPath(doc.path);
    setDocError(null);
    const result = await createDownloadUrl(supabase, doc);
    setBusyPath(null);
    if (result.ok) window.location.assign(result.value);
    else setDocError(result.error);
  }

  async function handleRemove(doc: DocItem) {
    if (!supabase) return;
    if (!window.confirm(`Delete ${doc.name}? This can't be undone.`)) return;
    setBusyPath(doc.path);
    setDocError(null);
    const result = await deleteDocument(supabase, doc);
    setBusyPath(null);
    if (result.ok) setDocs((prev) => prev.filter((d) => d.path !== doc.path));
    else setDocError(result.error);
  }

  const canUpload = Boolean(supabase && businessId && !uploading);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (canUpload) handleUploadFiles(Array.from(e.dataTransfer.files));
  }

  return (
    <>
      <h1 className="font-serif text-[26px] font-medium">Your Profile</h1>
      <p className="mb-7 text-sm text-ink-soft">
        Your details, your GST credentials, and your documents — all in one place.
      </p>

      {!CONFIGURED && (
        <div className="mb-6 rounded-xl border border-line bg-amber-soft px-4 py-3 text-[13px] text-ink">
          Not connected to Supabase yet — add your keys to .env.local to turn on
          saving. Uploads are disabled until then.
        </div>
      )}
      {loadError && (
        <div className="mb-6 rounded-xl bg-red-soft px-4 py-3 text-[13px] text-red">
          {loadError}
        </div>
      )}

      {/* Profile header */}
      <div className="mb-6 flex flex-wrap items-center gap-[22px] rounded-[16px] border border-line bg-surface p-8 shadow-sm">
        <div className="relative h-[92px] w-[92px] shrink-0">
          {avatarUrl && isOwnAvatarUrl(avatarUrl, SUPABASE_URL) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Profile picture"
              className={`h-full w-full rounded-full object-cover ${avatarBusy ? "opacity-50" : ""}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-2 font-serif text-[30px] text-ink-soft">
              SD
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={!supabase || !userId || avatarBusy}
            title="Upload profile picture"
            className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-surface bg-ink text-[13px] text-bg disabled:opacity-50"
          >
            {avatarBusy ? "…" : "📷"}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <h2 className="font-serif text-[21px] font-medium">Subhomoy Das</h2>
          <div className="text-[13px] text-ink-soft">Owner · Sharma Textiles &amp; Co.</div>
          <div className="mt-2 text-[11.5px] text-ink-soft">Member since September 2026</div>
          {avatarError && <p className="mt-2 text-xs text-red">{avatarError}</p>}
        </div>
      </div>

      {/* Personal & business details */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-[22px] py-[18px]">
          <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Personal &amp; business details
          </div>
          <h2 className="font-serif text-[17px] font-medium">Your details</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-[22px] py-[22px] pt-2 sm:grid-cols-2">
          <Field label="Full name" defaultValue="Subhomoy Das" />
          <Field label="Email" defaultValue="subhomoy@sharmatextiles.in" />
          <Field label="Phone" defaultValue="+91 98XXX XXXXX" />
          <Field label="Business name" defaultValue="Sharma Textiles & Co." />
          <Field label="Business type" defaultValue="Sole Proprietorship" />
          <Field label="Business address" defaultValue="Kolkata, West Bengal" />
        </div>
      </div>

      {/* GST & tax credentials */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-[22px] py-[18px]">
          <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Tax credentials
          </div>
          <h2 className="font-serif text-[17px] font-medium">GST &amp; registration details</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-[22px] py-[22px] pt-2 sm:grid-cols-2">
          <Field label="GSTIN" defaultValue="19ABCDE1234F1Z5" readOnly />
          <Field label="PAN" defaultValue="ABCDE1234F" readOnly />
          <Field label="Business registration no." defaultValue="U74999WB2026PTC123456" readOnly />
          <Field label="State jurisdiction" defaultValue="West Bengal" readOnly />
        </div>
        <div className="mx-[22px] mb-5 flex items-center gap-2 rounded-lg bg-surface-2 px-[15px] py-[11px] text-xs text-ink-soft">
          🔒 Login password and other security credentials are never shown
          here — manage those separately in Settings.
        </div>
      </div>

      {/* Document vault */}
      <div className="rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-line px-[22px] py-[18px]">
          <div>
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Document vault
            </div>
            <h2 className="font-serif text-[17px] font-medium">Certificates &amp; documents</h2>
          </div>
          <span className="mt-[3px] text-[12.5px] text-ink-soft">{docs.length} uploaded</span>
        </div>

        <div
          onClick={() => canUpload && docInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (canUpload) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mx-[22px] mt-2 rounded-[14px] border-2 border-dashed px-[30px] py-[30px] text-center transition ${
            canUpload ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          } ${dragOver ? "border-amber bg-amber-soft" : "border-line"}`}
        >
          <div className="mb-2 text-[26px]">📁</div>
          <p className="text-[13.5px] text-ink-soft">
            {uploading
              ? "Uploading…"
              : "Drag & drop a file here, or click to upload"}
          </p>
          <p className="mt-1 text-[11.5px] text-ink-soft">
            GST certificate, PAN card, business registration, Udyam certificate
            — kept here so you always have a copy to download, even offline.
            PDF or image, up to 10 MB each.
          </p>
        </div>
        <input
          ref={docInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = "";
            handleUploadFiles(files);
          }}
        />

        {!loading && CONFIGURED && !businessId && !loadError && (
          <p className="mx-[22px] mt-3 text-[12.5px] text-ink-soft">
            Your account isn&apos;t linked to a business yet, so documents can&apos;t be stored.
          </p>
        )}
        {docError && (
          <p className="mx-[22px] mt-3 rounded-lg bg-red-soft px-3.5 py-2.5 text-[12.5px] text-red">
            {docError}
          </p>
        )}

        <div className="flex flex-col gap-2.5 px-[22px] py-[18px]">
          {docs.length === 0 ? (
            <div className="text-[13px] italic text-ink-soft">
              {loading ? "Loading your documents…" : "No documents uploaded yet."}
            </div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.path}
                className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-surface-2 text-base">
                  {fileIcon(doc.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">{doc.name}</div>
                  <div className="text-[11px] text-ink-soft">
                    {[doc.size !== null ? formatBytes(doc.size) : "", formatDate(doc.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={busyPath === doc.path}
                    title="Download"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[13px] text-ink disabled:opacity-50"
                  >
                    ⬇
                  </button>
                  <button
                    onClick={() => handleRemove(doc)}
                    disabled={busyPath === doc.path}
                    title="Remove"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[13px] text-ink transition hover:bg-red-soft hover:text-red disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
