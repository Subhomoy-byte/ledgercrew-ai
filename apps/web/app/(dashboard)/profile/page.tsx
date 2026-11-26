"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
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
  type Result,
} from "@/lib/storage-client";
import {
  BUSINESS_TYPES,
  EMPTY_BUSINESS,
  EMPTY_GST,
  EMPTY_PERSONAL,
  normalizeBusiness,
  normalizeGst,
  normalizePersonal,
  stateFromGstin,
  validateBusiness,
  validateGst,
  validatePersonal,
  type BusinessValues,
  type GstValues,
  type PersonalValues,
} from "@/lib/profile-fields";
import { loadProfile, saveBusiness, saveGst, savePersonal } from "@/lib/profile-client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CONFIGURED = Boolean(SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type Status = { kind: "ok" | "error"; text: string };

function notReady<T>(): Promise<Result<T>> {
  return Promise.resolve({ ok: false, error: "Not connected to Supabase yet." });
}

/**
 * State for one form card: current values, last-saved values, which errors to
 * show (only for fields the person has touched, or after pressing Save), and
 * the save itself.
 */
function useSection<T extends Record<string, string>>(opts: {
  empty: T;
  validate: (v: T) => Partial<Record<keyof T, string>>;
  normalize: (v: T) => unknown;
  save: (v: T) => Promise<Result<T>>;
}) {
  const [values, setValues] = useState<T>(opts.empty);
  const [saved, setSaved] = useState<T>(opts.empty);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  const errors = opts.validate(values);
  const dirty = JSON.stringify(opts.normalize(values)) !== JSON.stringify(opts.normalize(saved));
  const visibleErrors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(errors) as (keyof T)[]) {
    if (attempted || touched[key]) visibleErrors[key] = errors[key];
  }

  function load(v: T) {
    setValues(v);
    setSaved(v);
    setTouched({});
    setAttempted(false);
    setStatus(null);
  }
  function setField(key: keyof T, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  }
  function touch(key: keyof T) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }
  async function submit() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setStatus(null);
    const result = await opts.save(values);
    setSaving(false);
    if (result.ok) {
      setValues(result.value);
      setSaved(result.value);
      setTouched({});
      setAttempted(false);
      setStatus({ kind: "ok", text: "Saved." });
    } else {
      setStatus({ kind: "error", text: result.error });
    }
  }

  return { values, saved, errors: visibleErrors, dirty, saving, status, load, setField, touch, submit };
}

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

function initialsFor(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  readOnly,
  disabled,
  placeholder,
  list,
  className,
  capitalize,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  list?: string;
  className?: string;
  capitalize?: boolean;
}) {
  const id = useId();
  const muted = readOnly || disabled;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
        list={list}
        autoCapitalize={capitalize ? "characters" : undefined}
        spellCheck={capitalize ? false : undefined}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-[10px] border px-3.5 py-[11px] text-[13.5px] outline-none transition focus:border-amber ${
          error ? "border-red" : "border-line"
        } ${muted ? "bg-surface-2 text-ink-soft" : "bg-bg text-ink"}`}
      />
      {error ? (
        <p className="mt-1 text-xs text-red">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11.5px] text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

function SaveBar({
  dirty,
  saving,
  status,
  editable,
  note,
}: {
  dirty: boolean;
  saving: boolean;
  status: Status | null;
  editable: boolean;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line px-[22px] py-4">
      <button
        type="submit"
        disabled={!editable || !dirty || saving}
        className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-bg disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      {status && (
        <span
          role={status.kind === "error" ? "alert" : "status"}
          className={`text-[12.5px] ${status.kind === "ok" ? "text-green" : "text-red"}`}
        >
          {status.text}
        </span>
      )}
      {!editable && note && <span className="text-[12.5px] text-ink-soft">{note}</span>}
    </div>
  );
}

function CardHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-line px-[22px] py-[18px]">
      <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
        {eyebrow}
      </div>
      <h2 className="font-serif text-[17px] font-medium">{title}</h2>
    </div>
  );
}

export default function ProfilePage() {
  // The Supabase client is created in the browser only (never during
  // server rendering).
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
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

  const personal = useSection<PersonalValues>({
    empty: EMPTY_PERSONAL,
    validate: validatePersonal,
    normalize: normalizePersonal,
    save: (v) => (supabase && userId ? savePersonal(supabase, userId, v) : notReady()),
  });
  const business = useSection<BusinessValues>({
    empty: EMPTY_BUSINESS,
    validate: validateBusiness,
    normalize: normalizeBusiness,
    save: (v) => (supabase && businessId ? saveBusiness(supabase, businessId, v) : notReady()),
  });
  const gst = useSection<GstValues>({
    empty: EMPTY_GST,
    validate: validateGst,
    normalize: normalizeGst,
    save: (v) => (supabase && businessId ? saveGst(supabase, businessId, v) : notReady()),
  });

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

      const loaded = await loadProfile(supabase, auth.user.id);
      if (cancelled) return;
      if (!loaded.ok) {
        setLoadError(loaded.error);
        setLoading(false);
        return;
      }

      const p = loaded.value;
      setUserId(p.userId);
      setEmail(p.email);
      setRole(p.role);
      setAvatarUrl(p.avatarUrl);
      setBusinessId(p.businessId);
      personal.load(p.personal);
      business.load(p.business);
      gst.load(p.gst);

      if (p.businessId) {
        const listed = await listDocuments(supabase, p.businessId);
        if (cancelled) return;
        if (listed.ok) setDocs(listed.value);
        else setDocError(listed.error);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const isOwner = role === "owner";
  const personalEditable = Boolean(supabase && userId);
  const businessEditable = Boolean(supabase && businessId && isOwner);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (canUpload) handleUploadFiles(Array.from(e.dataTransfer.files));
  }

  const shownName = personal.saved.full_name.trim();
  const ownerNote = "Only the business owner can change these details.";

  return (
    <>
      <h1 className="font-serif text-[26px] font-medium">Your Profile</h1>
      <p className="mb-7 text-sm text-ink-soft">
        Your details, your GST credentials, and your documents — all in one place.
      </p>

      {!CONFIGURED && (
        <div className="mb-6 rounded-xl border border-line bg-amber-soft px-4 py-3 text-[13px] text-ink">
          Not connected to Supabase yet — add your keys to .env.local to turn on
          saving. Everything below is disabled until then.
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
              {initialsFor(shownName, email)}
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
          <h2 className="font-serif text-[21px] font-medium">
            {shownName || (loading ? "Loading…" : "Your name")}
          </h2>
          <div className="text-[13px] text-ink-soft">
            {isOwner ? "Owner" : "Team member"}
            {business.saved.name ? ` · ${business.saved.name}` : ""}
          </div>
          {email && <div className="mt-2 text-[11.5px] text-ink-soft">{email}</div>}
          {avatarError && <p className="mt-2 text-xs text-red">{avatarError}</p>}
        </div>
      </div>

      {/* Your details */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <CardHeader eyebrow="Personal" title="Your details" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            personal.submit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 px-[22px] py-[22px] pt-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              value={personal.values.full_name}
              onChange={(v) => personal.setField("full_name", v)}
              onBlur={() => personal.touch("full_name")}
              error={personal.errors.full_name}
              disabled={!personalEditable}
              placeholder="Your name"
            />
            <TextField
              label="Email"
              value={email}
              readOnly
              hint="This is the email you sign in with."
            />
            <TextField
              label="Phone"
              value={personal.values.phone}
              onChange={(v) => personal.setField("phone", v)}
              onBlur={() => personal.touch("phone")}
              error={personal.errors.phone}
              disabled={!personalEditable}
              placeholder="+91 98300 00000"
            />
          </div>
          <SaveBar
            dirty={personal.dirty}
            saving={personal.saving}
            status={personal.status}
            editable={personalEditable}
          />
        </form>
      </div>

      {/* Business details */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <CardHeader eyebrow="Business" title="Business details" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            business.submit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 px-[22px] py-[22px] pt-4 sm:grid-cols-2">
            <TextField
              label="Business name"
              value={business.values.name}
              onChange={(v) => business.setField("name", v)}
              onBlur={() => business.touch("name")}
              error={business.errors.name}
              disabled={!businessEditable}
              placeholder="Your business name"
            />
            <TextField
              label="Business type"
              value={business.values.business_type}
              onChange={(v) => business.setField("business_type", v)}
              onBlur={() => business.touch("business_type")}
              error={business.errors.business_type}
              disabled={!businessEditable}
              placeholder="e.g. Partnership"
              list="business-types"
            />
            <TextField
              className="sm:col-span-2"
              label="Business address"
              value={business.values.address}
              onChange={(v) => business.setField("address", v)}
              onBlur={() => business.touch("address")}
              error={business.errors.address}
              disabled={!businessEditable}
              placeholder="Street, city, state, PIN"
            />
          </div>
          <datalist id="business-types">
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <SaveBar
            dirty={business.dirty}
            saving={business.saving}
            status={business.status}
            editable={businessEditable}
            note={supabase && businessId && !isOwner ? ownerNote : undefined}
          />
        </form>
      </div>

      {/* GST & registration */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <CardHeader eyebrow="Tax credentials" title="GST & registration details" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            gst.submit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 px-[22px] py-[22px] pt-4 sm:grid-cols-2">
            <TextField
              label="GSTIN"
              value={gst.values.gstin}
              onChange={(v) => gst.setField("gstin", v)}
              onBlur={() => gst.touch("gstin")}
              error={gst.errors.gstin}
              disabled={!businessEditable}
              placeholder="e.g. 27AAPFU0939F1ZV"
              capitalize
            />
            <TextField
              label="PAN"
              value={gst.values.pan}
              onChange={(v) => gst.setField("pan", v)}
              onBlur={() => gst.touch("pan")}
              error={gst.errors.pan}
              disabled={!businessEditable}
              placeholder="e.g. ABCDE1234F"
              capitalize
            />
            <TextField
              label="Business registration no."
              value={gst.values.registration_number}
              onChange={(v) => gst.setField("registration_number", v)}
              onBlur={() => gst.touch("registration_number")}
              error={gst.errors.registration_number}
              disabled={!businessEditable}
              placeholder="Optional"
            />
            <TextField
              label="State jurisdiction"
              value={stateFromGstin(gst.values.gstin) ?? ""}
              readOnly
              placeholder="Filled in from your GSTIN"
              hint="Worked out from the first two digits of your GSTIN."
            />
          </div>
          <div className="mx-[22px] mb-5 flex items-center gap-2 rounded-lg bg-surface-2 px-[15px] py-[11px] text-xs text-ink-soft">
            🔒 Login password and other security credentials are never shown
            here — manage those separately in Settings.
          </div>
          <SaveBar
            dirty={gst.dirty}
            saving={gst.saving}
            status={gst.status}
            editable={businessEditable}
            note={supabase && businessId && !isOwner ? ownerNote : undefined}
          />
        </form>
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
            {uploading ? "Uploading…" : "Drag & drop a file here, or click to upload"}
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
