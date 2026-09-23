"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const SPARKLINE_POINTS =
  "0,45 25,42 50,38 75,40 100,30 125,32 150,20 175,18 200,10 220,8";

const ease = "power3.out";

function KpiTile({
  label,
  value,
  flag,
}: {
  label: string;
  value: string;
  flag: "warn" | "amber" | "ok";
}) {
  const flagColor =
    flag === "warn" ? "text-red" : flag === "amber" ? "text-amber" : "text-green";
  return (
    <div className="rounded-xl border border-line bg-surface-2/55 px-4 py-[13px]">
      <div className="mb-[5px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
        {label}
      </div>
      <div className={`font-mono text-[16px] font-medium ${flagColor}`}>{value}</div>
    </div>
  );
}

type AttnItem = {
  id: string;
  avatar: string;
  title: string;
  desc: string;
  priority: "high" | "med";
  primaryLabel: string;
  secondaryLabel: string;
};

const ATTN_ITEMS: AttnItem[] = [
  {
    id: "reminder-sharma",
    avatar: "Gu",
    title: "A reminder to Sharma Textiles is ready to send",
    desc: 'Guardrail approved the tone — this one\'s set to "approve before send."',
    priority: "med",
    primaryLabel: "Send it",
    secondaryLabel: "Edit first",
  },
  {
    id: "gstin-0430",
    avatar: "Co",
    title: "INV-0430 is missing a GSTIN",
    desc: "Compliance can't file this one until the client's GSTIN is added.",
    priority: "high",
    primaryLabel: "Add it now",
    secondaryLabel: "Remind me later",
  },
];

type ActivityType = "flag" | "note" | "good";
type ActivityEntry = {
  who: string;
  text: string;
  type: ActivityType;
  icon: string;
  time: string;
};

const INITIAL_ACTIVITY: ActivityEntry[] = [
  { who: "Intake", text: "read a forwarded photo from Anjali Freelance Co. — extracted ₹15,000.", type: "note", icon: "🔵", time: "9:14" },
  { who: "Collections", text: "drafted a reminder for Sharma Textiles (12 days overdue).", type: "note", icon: "🔵", time: "9:15" },
  { who: "Guardrail", text: "reviewed the draft — tone is firm but fair. Approved.", type: "good", icon: "✅", time: "9:15" },
  { who: "Compliance", text: "flagged a missing GSTIN on INV-0430 — needs your review.", type: "flag", icon: "⚠️", time: "9:16" },
];

const ACTIVITY_POOL: Omit<ActivityEntry, "time">[] = [
  { who: "Intake", text: "picked up a new receipt from Ray Consulting via WhatsApp.", type: "note", icon: "🔵" },
  { who: "Compliance", text: "flagged a missing GSTIN on INV-0430 — waiting on your review.", type: "flag", icon: "⚠️" },
  { who: "Collections", text: "sent the scheduled follow-up to Bose Digital Studio.", type: "good", icon: "✅" },
  { who: "Guardrail", text: "held a draft back for edits — line 2 read as too aggressive.", type: "flag", icon: "⚠️" },
  { who: "Cash-flow", text: "recalculated: payroll on the 30th is covered.", type: "good", icon: "✅" },
];

const activityBoxClass: Record<ActivityType, string> = {
  flag: "border-red bg-red-soft animate-[activityBlink_1.4s_ease-in-out_infinite]",
  note: "border-line bg-surface-2",
  good: "border-green/45 bg-green-soft",
};

const LEDGER_SNAPSHOT = [
  { client: "Sharma Textiles", amount: "₹42,000", status: "12d overdue", tone: "overdue" as const },
  { client: "Bose Digital Studio", amount: "₹28,500", status: "6d overdue", tone: "overdue" as const },
  { client: "Anjali Freelance Co.", amount: "₹15,000", status: "Due Fri", tone: "due" as const },
];

type ChatMsg = { who: "user" | "bot"; text: string };

type CalCell = {
  day: number;
  inMonth: boolean;
  isToday?: boolean;
  marked?: { type: "flag" | "note" | "good"; tip: string };
};

const CAL_DOT_CLASS: Record<"flag" | "note" | "good", string> = {
  flag: "bg-red",
  note: "bg-amber",
  good: "bg-green",
};

const SEPTEMBER_GRID: CalCell[] = [
  { day: 30, inMonth: false }, { day: 31, inMonth: false },
  ...[1, 2, 3, 4, 5].map((d) => ({ day: d, inMonth: true })),
  ...[6, 7, 8, 9, 10, 11, 12].map((d) => ({ day: d, inMonth: true })),
  { day: 13, inMonth: true }, { day: 14, inMonth: true }, { day: 15, inMonth: true },
  { day: 16, inMonth: true }, { day: 17, inMonth: true, isToday: true },
  { day: 18, inMonth: true }, { day: 19, inMonth: true },
  { day: 20, inMonth: true, marked: { type: "flag", tip: "Bose Digital Studio — final notice sends" } },
  { day: 21, inMonth: true }, { day: 22, inMonth: true },
  { day: 23, inMonth: true, marked: { type: "note", tip: "GSTR-3B filing deadline" } },
  { day: 24, inMonth: true }, { day: 25, inMonth: true }, { day: 26, inMonth: true },
  { day: 27, inMonth: true }, { day: 28, inMonth: true }, { day: 29, inMonth: true },
  { day: 30, inMonth: true, marked: { type: "good", tip: "Payroll — cash-flow confirms it's covered" } },
  { day: 1, inMonth: false }, { day: 2, inMonth: false }, { day: 3, inMonth: false },
];

const UPCOMING = [
  { dot: "flag" as const, title: "Final notice to Bose Digital Studio", agent: "Collections", when: "Sep 20" },
  { dot: "note" as const, title: "GSTR-3B filing deadline", agent: "Compliance", when: "Sep 23" },
  { dot: "good" as const, title: "Payroll — confirmed covered", agent: "Cash-flow", when: "Sep 30" },
  { dot: "note" as const, title: "TDS payment due", agent: "Compliance", when: "Oct 7" },
];

const QUICK_QUESTIONS = [
  "How much am I owed right now?",
  "When is my GST filing due?",
  "Will I make payroll this month?",
];

function botReplyFor(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("owe") || t.includes("outstanding")) {
    return "You're owed ₹1,84,200 right now across 12 open invoices — three are overdue, and Collections is already following up on two of them.";
  }
  if (t.includes("gst") || t.includes("tax") || t.includes("fil")) {
    return "Your GSTR-3B filing is due September 23 — six days out. Compliance already has a draft ready for you to review.";
  }
  if (t.includes("payroll") || t.includes("cash") || t.includes("afford")) {
    return "Yes — Cash-flow confirms payroll on the 30th is covered, even if Sharma Textiles pays late.";
  }
  return "I'm a demo crew for now — once connected to your real ledger, I'd answer that from your actual invoices, GST status, and cash position.";
}

export default function DashboardPage() {
  const heroNumRef = useRef<HTMLSpanElement>(null);
  const sparklineRef = useRef<SVGPolylineElement>(null);
  const kpiRefs = useRef<(HTMLDivElement | null)[]>([]);
  const attnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const gaugeRingRef = useRef<SVGCircleElement>(null);
  const gaugeNumRef = useRef<HTMLDivElement>(null);
  const [calShake, setCalShake] = useState(false);

  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [activity, setActivity] = useState<ActivityEntry[]>(INITIAL_ACTIVITY);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      who: "bot",
      text: "Hi — I can answer questions about your invoices, GST, or cash flow using what the crew already knows. What's on your mind?",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (heroNumRef.current) {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 184200,
        duration: reduceMotion ? 0 : 1.3,
        delay: reduceMotion ? 0 : 0.2,
        ease: "power2.out",
        onUpdate: () => {
          if (heroNumRef.current) {
            heroNumRef.current.textContent = Math.floor(counter.val).toLocaleString(
              "en-IN"
            );
          }
        },
      });
    }

    if (sparklineRef.current) {
      const length = sparklineRef.current.getTotalLength();
      gsap.fromTo(
        sparklineRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: reduceMotion ? 0 : 1.4,
          delay: reduceMotion ? 0 : 0.3,
          ease: "power2.inOut",
        }
      );
    }

    const kpis = kpiRefs.current.filter(Boolean);
    if (kpis.length) {
      gsap.fromTo(
        kpis,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: reduceMotion ? 0 : 0.45,
          stagger: reduceMotion ? 0 : 0.08,
          delay: reduceMotion ? 0 : 0.3,
          ease,
        }
      );
    }

    const attn = attnRefs.current.filter(Boolean);
    if (attn.length) {
      gsap.fromTo(
        attn,
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: reduceMotion ? 0 : 0.45,
          stagger: reduceMotion ? 0 : 0.1,
          delay: reduceMotion ? 0 : 0.25,
          ease,
        }
      );
    }

    // Business health gauge
    const GAUGE_SCORE = 82;
    const CIRCUMFERENCE = 289;
    if (gaugeRingRef.current) {
      gsap.to(gaugeRingRef.current, {
        strokeDashoffset: CIRCUMFERENCE - (CIRCUMFERENCE * GAUGE_SCORE) / 100,
        duration: reduceMotion ? 0 : 1.3,
        delay: reduceMotion ? 0 : 0.4,
        ease: "power2.out",
      });
    }
    if (gaugeNumRef.current) {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: GAUGE_SCORE,
        duration: reduceMotion ? 0 : 1.3,
        delay: reduceMotion ? 0 : 0.4,
        ease: "power2.out",
        onUpdate: () => {
          if (gaugeNumRef.current) {
            gaugeNumRef.current.textContent = String(Math.floor(counter.val));
          }
        },
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const pick = ACTIVITY_POOL[Math.floor(Math.random() * ACTIVITY_POOL.length)];
      const now = new Date();
      const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`;
      setActivity((prev) => [...prev.slice(-9), { ...pick, time }]);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  function resolveAttn(id: string) {
    setResolved((prev) => ({ ...prev, [id]: true }));
  }

  function triggerCalShake() {
    setCalShake(false);
    requestAnimationFrame(() => setCalShake(true));
    setTimeout(() => setCalShake(false), 350);
  }

  function openChat() {
    setChatOpen(true);
    setTimeout(() => chatInputRef.current?.focus(), 250);
  }

  function sendChat(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { who: "user", text: msg }]);
    setInput("");
    setTyping(true);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { who: "bot", text: botReplyFor(msg) }]);
    }, reduceMotion ? 100 : 1100);
  }

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight });
  }, [messages, typing]);

  return (
    <>
      <div className="mb-[6px] text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-soft">
        Dashboard
      </div>
      <div className="mb-1 flex flex-wrap items-center gap-3.5">
        <h1 className="font-serif text-[26px] font-medium">
          Good morning. Here&apos;s where things stand.
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green/35 bg-green-soft px-3 py-[5px] text-xs font-medium text-green">
          <span className="text-[11px]">✓</span> GST compliant
        </span>
      </div>
      <p className="mb-7 text-sm text-ink-soft">Thursday, 17 September — Kolkata</p>

      <div className="mb-6 grid grid-cols-1 gap-8 rounded-[16px] border border-line bg-surface p-8 shadow-sm lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="font-serif text-[46px] font-medium leading-[1.05]">
            <small className="mb-2 block font-sans text-[15px] font-medium text-ink-soft">
              Outstanding right now
            </small>
            ₹<span ref={heroNumRef}>0</span>
          </div>
          <p className="mt-2.5 max-w-[46ch] text-sm text-ink-soft">
            Across 12 open invoices. Three have crossed their due date —
            Collections is already on two of them.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["warn", "amber", "ok"] as const).map((flag, i) => (
              <div key={flag} ref={(el) => { kpiRefs.current[i] = el; }}>
                <KpiTile
                  label={["Overdue", "GST filing", "Cash position"][i]}
                  value={["3 invoices", "Due in 6 days", "Healthy"][i]}
                  flag={flag}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[14px] bg-surface-2 px-5 py-[18px]">
          <div>
            <div className="mb-1 text-[12.5px] text-ink-soft">
              30-day cash forecast
            </div>
            <div className="font-mono text-[19px] text-green">
              ↑ ₹2.1L by Oct 15
            </div>
          </div>
          <svg viewBox="0 0 220 60" width="100%" height="60" className="mt-3.5">
            <polyline
              ref={sparklineRef}
              points={SPARKLINE_POINTS}
              fill="none"
              stroke="var(--green)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Needs your attention */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-line px-[22px] py-[18px]">
          <div>
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Priority queue
            </div>
            <h2 className="font-serif text-[17px] font-medium">Needs your attention</h2>
          </div>
          <span className="mt-[3px] text-[12.5px] text-ink-soft">
            {ATTN_ITEMS.filter((a) => !resolved[a.id]).length} open
          </span>
        </div>
        <div className="px-[22px] py-[6px]">
          {ATTN_ITEMS.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => { attnRefs.current[i] = el; }}
              className={`flex gap-3.5 border-b border-line py-4 pl-4 last:border-b-0 ${
                item.priority === "high" ? "border-l-[3px] border-l-red" : "border-l-[3px] border-l-amber"
              } ${resolved[item.id] ? "pointer-events-none opacity-45" : ""}`}
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 font-serif text-[13px] text-ink-soft">
                {item.avatar}
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">
                  {item.title}
                  {resolved[item.id] && (
                    <span className="font-normal text-green"> — done</span>
                  )}
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-soft">{item.desc}</div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => resolveAttn(item.id)}
                    className="rounded-full bg-ink px-[13px] py-1.5 text-xs font-medium text-bg"
                  >
                    {item.primaryLabel}
                  </button>
                  <button className="rounded-full bg-surface-2 px-[13px] py-1.5 text-xs text-ink">
                    {item.secondaryLabel}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ask your crew */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-[22px] py-[18px]">
          <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Ask your crew
          </div>
          <h2 className="font-serif text-[17px] font-medium">
            Have a question about your business?
          </h2>
        </div>
        <div className="px-[22px] py-[22px] pt-1">
          <button
            onClick={openChat}
            className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-bg px-[18px] py-3.5 text-left transition hover:-translate-y-px hover:border-amber"
          >
            <span className="text-[17px]">💬</span>
            <span className="text-[13.5px] text-ink-soft">
              Ask anything — &quot;How much am I owed this month?&quot;, &quot;When&apos;s my GST due?&quot;…
            </span>
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  openChat();
                  sendChat(q);
                }}
                className="rounded-full border border-line bg-surface-2 px-3 py-[6px] text-[11.5px] text-ink-soft transition hover:border-amber hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Latest activity — promoted, full width */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-line px-[22px] py-[18px]">
          <div>
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              What the crew is doing right now
            </div>
            <h2 className="font-serif text-[17px] font-medium">Latest activity</h2>
          </div>
          <span className="flex shrink-0 items-center gap-2 rounded-full bg-ink px-[18px] py-[9px] text-[12.5px] font-semibold text-bg">
            <span className="h-2 w-2 animate-[liveBlink_1.4s_ease-in-out_infinite] rounded-full bg-[#ff5c5c]" />
            Live
          </span>
        </div>
        <div className="flex max-h-[460px] flex-col gap-2.5 overflow-y-auto px-[22px] pb-2 pt-[18px]">
          {activity.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 rounded-[14px] border px-4 py-[13px] text-[13.5px] ${activityBoxClass[a.type]}`}
            >
              <span className="shrink-0 text-[15px]">{a.icon}</span>
              <span className="flex-1">
                <span className="font-semibold">{a.who}</span> {a.text}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-ink-soft">{a.time}</span>
            </div>
          ))}
        </div>
        <div className="px-[22px] pb-5 pt-1">
          <button className="w-full rounded-full border border-line bg-surface py-[10px] text-[13.5px] font-medium text-ink">
            View all activity
          </button>
        </div>
      </div>

      {/* Top of your ledger */}
      <div className="mb-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-line px-[22px] py-[18px]">
          <div>
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Ledger snapshot
            </div>
            <h2 className="font-serif text-[17px] font-medium">Top of your ledger</h2>
          </div>
          <span className="mt-[3px] text-[12.5px] text-ink-soft">3 most urgent</span>
        </div>
        <div>
          {LEDGER_SNAPSHOT.map((row) => (
            <div
              key={row.client}
              className="flex items-center gap-3 border-b border-line px-[22px] py-3 text-[13.5px] last:border-b-0"
            >
              <span className="flex-1">{row.client}</span>
              <span className="font-mono">{row.amount}</span>
              <span
                className={`rounded-full px-[10px] py-1 text-[11.5px] ${
                  row.tone === "overdue" ? "bg-red-soft text-red" : "bg-amber-soft text-amber"
                }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly brief + Business health */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-[22px] py-[18px]">
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Weekly summary
            </div>
            <h2 className="font-serif text-[17px] font-medium">This week&apos;s brief</h2>
          </div>
          <div className="px-[22px] py-[22px] text-[13.5px] leading-relaxed text-ink-soft">
            Three clients are past due. GST filing window closes in 6 days —
            Compliance has a draft ready. Cash position stays healthy through
            October even if Sharma Textiles pays late.
          </div>
        </div>

        <div className="rounded-[16px] border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-[22px] py-[18px]">
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Health score
            </div>
            <h2 className="font-serif text-[17px] font-medium">Business health</h2>
          </div>
          <div className="flex items-center gap-5 px-[22px] py-[18px]">
            <div className="relative h-[108px] w-[108px] shrink-0">
              <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90">
                <circle cx="54" cy="54" r="46" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                <circle
                  ref={gaugeRingRef}
                  cx="54"
                  cy="54"
                  r="46"
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={289}
                  strokeDashoffset={289}
                />
              </svg>
              <div
                ref={gaugeNumRef}
                className="absolute inset-0 flex items-center justify-center font-serif text-2xl"
              >
                0
              </div>
            </div>
            <div className="text-[12.5px] leading-relaxed text-ink-soft">
              <b className="text-ink">On track.</b>
              <br />
              Compliance clean, one client watch-listed, cash position healthy
              through month-end.
            </div>
          </div>
        </div>
      </div>

      {/* Financial calendar */}
      <div
        className="relative overflow-hidden rounded-[16px] border shadow-sm"
        style={{
          background: "color-mix(in srgb, var(--surface) 55%, transparent)",
          backdropFilter: "blur(18px) saturate(1.3)",
          WebkitBackdropFilter: "blur(18px) saturate(1.3)",
          borderColor: "color-mix(in srgb, var(--line) 65%, transparent)",
        }}
      >
        <div className="flex items-center justify-between px-[22px] pb-0.5 pt-[18px]">
          <div>
            <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Financial calendar
            </div>
            <div className="font-serif text-base font-medium">September 2026</div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={triggerCalShake}
              className={`h-[26px] w-[26px] rounded-lg border border-line text-ink transition hover:border-amber ${
                calShake ? "animate-[calShake_0.35s_ease]" : ""
              }`}
            >
              ‹
            </button>
            <button
              onClick={triggerCalShake}
              className={`h-[26px] w-[26px] rounded-lg border border-line text-ink transition hover:border-amber ${
                calShake ? "animate-[calShake_0.35s_ease]" : ""
              }`}
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 px-[22px] py-[14px] text-[11.5px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-[7px] w-[7px] rounded-full bg-amber" /> Tax deadline · Compliance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[7px] w-[7px] rounded-full bg-red" /> Collections escalation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[7px] w-[7px] rounded-full bg-green" /> Payment date · Cash-flow
          </span>
        </div>

        <div className="grid grid-cols-7 gap-[5px] px-[18px] pb-[6px]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="pb-1 text-center text-[10px] text-ink-soft">
              {d}
            </div>
          ))}
          {SEPTEMBER_GRID.map((cell, i) => (
            <div
              key={i}
              data-tip={cell.marked?.tip}
              className={`flex aspect-square flex-col items-center justify-center gap-[3px] rounded-[10px] text-xs ${
                cell.inMonth ? "text-ink" : "text-ink-soft/55"
              } ${cell.isToday ? "border-[1.5px] border-amber font-semibold" : ""} ${
                cell.marked ? "cal-cell-marked" : ""
              }`}
            >
              <span>{cell.day}</span>
              {cell.marked && (
                <span className={`h-[5px] w-[5px] rounded-full ${CAL_DOT_CLASS[cell.marked.type]}`} />
              )}
            </div>
          ))}
        </div>

        <div
          className="flex flex-col gap-3 px-[22px] pb-5 pt-3.5"
          style={{ borderTop: "1px solid color-mix(in srgb, var(--line) 65%, transparent)" }}
        >
          {UPCOMING.map((u) => (
            <div key={u.title} className="flex items-center gap-3 text-[13px]">
              <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${CAL_DOT_CLASS[u.dot]}`} />
              <span className="flex-1">{u.title}</span>
              <span className="rounded-full bg-surface-2/75 px-[9px] py-[3px] text-[10.5px] text-ink-soft">
                {u.agent}
              </span>
              <span className="font-mono text-[11.5px] text-ink-soft">{u.when}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={`fixed bottom-7 right-7 z-[45] flex h-[480px] max-h-[70vh] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-lg transition-all duration-300 ${
          chatOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-5 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-surface-2 font-serif text-[13px]">
            Or
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Orchestrator
            </div>
            <h4 className="font-serif text-[14.5px] font-medium">Ask your crew</h4>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="ml-auto p-1 text-[15px] text-ink-soft"
          >
            ✕
          </button>
        </div>
        <div ref={chatBodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.who === "bot"
                  ? "self-start rounded-bl-[4px] bg-surface-2"
                  : "self-end rounded-br-[4px] bg-ink text-bg"
              }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="flex w-fit gap-1 self-start rounded-2xl bg-surface-2 px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 border-t border-line p-3">
          <input
            ref={chatInputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Type a question…"
            className="flex-1 rounded-full border border-line bg-bg px-3.5 py-2 text-[13px] outline-none focus:border-amber"
          />
          <button
            onClick={() => sendChat()}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ink text-bg"
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
