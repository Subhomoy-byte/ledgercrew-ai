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

type ChatMsg = { who: "user" | "bot"; text: string };

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

  const [resolved, setResolved] = useState<Record<string, boolean>>({});
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
  }, []);

  function resolveAttn(id: string) {
    setResolved((prev) => ({ ...prev, [id]: true }));
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
