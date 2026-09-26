"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { applyTheme, getStoredTheme, type ThemeChoice } from "@/lib/theme";

function glassStyle(borderTint?: string): CSSProperties {
  return {
    background: "color-mix(in srgb, var(--surface) 50%, transparent)",
    backdropFilter: "blur(20px) saturate(1.4)",
    WebkitBackdropFilter: "blur(20px) saturate(1.4)",
    borderColor: borderTint ?? "color-mix(in srgb, var(--line) 55%, transparent)",
  };
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-card mb-6 overflow-hidden rounded-[22px] border shadow-sm" style={glassStyle()}>
      <div className="border-b border-line/50 px-7 py-5">
        <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          {eyebrow}
        </div>
        <h2 className="font-serif text-[17px] font-medium">{title}</h2>
      </div>
      <div className="px-7 py-6">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-amber" : "bg-surface-2"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({ title, desc, control }: { title: string; desc: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 py-4 last:border-b-0 first:pt-0">
      <div>
        <div className="text-[13.5px] font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-ink-soft">{desc}</div>
      </div>
      {control}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  desc,
  confirmLabel,
  danger,
  requireText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  desc: string;
  confirmLabel: string;
  danger?: boolean;
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  if (!open) return null;
  const canConfirm = !requireText || typed === requireText;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-[400px] rounded-2xl border border-line bg-surface p-7 shadow-lg">
        <h3 className="font-serif text-lg font-medium">{title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{desc}</p>
        {requireText && (
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Type ${requireText} to confirm`}
            className="mt-4 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-red"
          />
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-surface-2 px-4 py-2 text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`rounded-full px-4 py-2 text-[13px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
              danger ? "bg-red" : "bg-ink !text-bg"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const THEME_OPTIONS: { key: ThemeChoice; label: string; bars: [string, string] }[] = [
  { key: "light", label: "Light", bars: ["#F3EEDD", "#FFFDF6"] },
  { key: "dark", label: "Dark", bars: ["#07090A", "#101312"] },
  { key: "system", label: "System", bars: ["#F3EEDD", "#07090A"] },
];

const TEAM = [
  { initials: "SD", name: "Subhomoy Das", role: "Owner" },
  { initials: "RK", name: "Riya Kapoor", role: "Accountant" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [approveBeforeSend, setApproveBeforeSend] = useState(true);
  const [dailyBrief, setDailyBrief] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = document.querySelectorAll(".glass-card");
    if (cards.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: reduceMotion ? 0 : 0.55,
          stagger: reduceMotion ? 0 : 0.1,
          ease: "power3.out",
        }
      );
    }
  }, []);

  function chooseTheme(choice: ThemeChoice) {
    applyTheme(choice, true);
    setTheme(choice);
  }

  function handleLogout() {
    setLogoutOpen(false);
    router.push("/login");
  }

  function handleDeleteAccount() {
    setDeleteOpen(false);
    // TODO(backend): call a real account-deletion endpoint once Supabase is wired up.
    alert("Account deletion would be processed here — no backend is connected yet.");
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-16 -top-20 h-72 w-72 rounded-full opacity-20 blur-[90px]"
          style={{ background: "var(--amber)", animation: "rupeeDrift 16s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full opacity-15 blur-[90px]"
          style={{ background: "var(--green)", animation: "rupeeDrift 20s ease-in-out infinite reverse" }}
        />
      </div>

      <h1 className="font-serif text-[26px] font-medium dark:text-white dark:[text-shadow:0_0_30px_rgba(240,176,74,0.25)]">
        Settings
      </h1>
      <p className="mb-7 text-sm text-ink-soft">
        Everything about how LedgerCrew runs for your business.
      </p>

      <SectionCard eyebrow="Appearance" title="Theme">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => chooseTheme(opt.key)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                theme === opt.key ? "border-amber" : "border-line"
              }`}
            >
              <div className="mb-2.5 flex h-12 overflow-hidden rounded-lg">
                <div className="flex-1" style={{ background: opt.bars[0] }} />
                <div className="flex-1" style={{ background: opt.bars[1] }} />
              </div>
              <div className="text-[13px] font-medium">{opt.label}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard eyebrow="Automation" title="How the crew acts on your behalf">
        <SettingRow
          title="Approve before send"
          desc="Collections drafts wait for your sign-off instead of sending automatically."
          control={<Switch checked={approveBeforeSend} onChange={setApproveBeforeSend} />}
        />
        <div className="border-b border-line/60 py-4">
          <label className="mb-1.5 block text-[13.5px] font-medium">WhatsApp intake number</label>
          <input
            type="text"
            defaultValue="+91 98XXX-XXXXX"
            className="w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
          />
        </div>
        <div className="pt-4">
          <label className="mb-1.5 block text-[13.5px] font-medium">Voice &amp; language</label>
          <select
            defaultValue="English"
            className="w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Bengali</option>
            <option>Tamil</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Notifications" title="What you hear about, and how">
        <SettingRow
          title="Daily business brief"
          desc="A two-line email summary each morning."
          control={<Switch checked={dailyBrief} onChange={setDailyBrief} />}
        />
        <SettingRow
          title="Urgent flags on WhatsApp"
          desc="Compliance issues and overdue escalations, sent immediately."
          control={<Switch checked={urgentAlerts} onChange={setUrgentAlerts} />}
        />
        <SettingRow
          title="Weekly digest"
          desc="A longer roundup every Monday."
          control={<Switch checked={weeklyDigest} onChange={setWeeklyDigest} />}
        />
      </SectionCard>

      <SectionCard eyebrow="Team" title="Who has access">
        <div className="flex flex-col gap-3">
          {TEAM.map((m) => (
            <div key={m.name} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-serif text-[13px]">
                {m.initials}
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">{m.name}</div>
                <div className="text-xs text-ink-soft">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 rounded-full border border-line px-4 py-2 text-[13px] font-medium transition hover:border-amber"
        >
          + Invite team member
        </button>
      </SectionCard>

      <div
        className="glass-card overflow-hidden rounded-[22px] border shadow-sm"
        style={glassStyle("color-mix(in srgb, var(--red) 45%, transparent)")}
      >
        <div className="border-b px-7 py-5" style={{ borderColor: "color-mix(in srgb, var(--red) 25%, transparent)" }}>
          <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-red">
            Danger zone
          </div>
          <h2 className="font-serif text-[17px] font-medium">Account</h2>
        </div>
        <div className="flex flex-col gap-3 px-7 py-6 sm:flex-row">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="rounded-full border border-line px-5 py-2.5 text-[13.5px] font-medium transition hover:border-amber"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-full bg-red px-5 py-2.5 text-[13.5px] font-medium text-white"
          >
            Delete account
          </button>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title="Log out of LedgerCrew?"
        desc="You'll need to sign in again to get back to your dashboard."
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
      <ConfirmModal
        open={deleteOpen}
        title="Delete your account?"
        desc="This permanently removes your business, invoices, and all agent history. This cannot be undone."
        confirmLabel="Delete permanently"
        danger
        requireText="DELETE"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
