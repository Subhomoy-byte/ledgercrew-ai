"use client";

import { useRef, useState, type DragEvent } from "react";

type DocFile = { id: string; file: File; url: string };

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "📕";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "🖼️";
  if (["doc", "docx"].includes(ext)) return "📄";
  return "📎";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function addFiles(files: FileList | File[]) {
    const newDocs = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setDocs((prev) => [...prev, ...newDocs]);
  }

  function removeDoc(id: string) {
    setDocs((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((d) => d.id !== id);
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  return (
    <>
      <h1 className="font-serif text-[26px] font-medium">Your Profile</h1>
      <p className="mb-7 text-sm text-ink-soft">
        Your details, your GST credentials, and your documents — all in one place.
      </p>

      {/* Profile header */}
      <div className="mb-6 flex flex-wrap items-center gap-[22px] rounded-[16px] border border-line bg-surface p-8 shadow-sm">
        <div className="relative h-[92px] w-[92px] shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt="Profile picture"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-2 font-serif text-[30px] text-ink-soft">
              SD
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            title="Upload profile picture"
            className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-surface bg-ink text-[13px] text-bg"
          >
            📷
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <h2 className="font-serif text-[21px] font-medium">Subhomoy Das</h2>
          <div className="text-[13px] text-ink-soft">Owner · Sharma Textiles &amp; Co.</div>
          <div className="mt-2 text-[11.5px] text-ink-soft">Member since September 2026</div>
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
          <span className="mt-[3px] text-[12.5px] text-ink-soft">
            {docs.length} uploaded
          </span>
        </div>

        <div
          onClick={() => docInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mx-[22px] mt-2 cursor-pointer rounded-[14px] border-2 border-dashed px-[30px] py-[30px] text-center transition ${
            dragOver ? "border-amber bg-amber-soft" : "border-line"
          }`}
        >
          <div className="mb-2 text-[26px]">📁</div>
          <p className="text-[13.5px] text-ink-soft">
            Drag &amp; drop a file here, or click to upload
          </p>
          <p className="mt-1 text-[11.5px] text-ink-soft">
            GST certificate, PAN card, business registration, Udyam
            certificate — kept here so you always have a copy to download,
            even offline.
          </p>
        </div>
        <input
          ref={docInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />

        <div className="flex flex-col gap-2.5 px-[22px] py-[18px]">
          {docs.length === 0 ? (
            <div className="text-[13px] italic text-ink-soft">
              No documents uploaded yet.
            </div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-surface-2 text-base">
                  {fileIcon(doc.file.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">{doc.file.name}</div>
                  <div className="text-[11px] text-ink-soft">
                    {formatSize(doc.file.size)} · uploaded just now
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <a
                    href={doc.url}
                    download={doc.file.name}
                    title="Download"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[13px] text-ink"
                  >
                    ⬇
                  </a>
                  <button
                    onClick={() => removeDoc(doc.id)}
                    title="Remove"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[13px] text-ink transition hover:bg-red-soft hover:text-red"
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
