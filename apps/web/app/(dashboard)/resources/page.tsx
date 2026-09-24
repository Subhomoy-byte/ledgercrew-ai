"use client";

import { useState } from "react";

type QnaKey = "gst" | "eway" | "itr" | "udyam";

const QNA_DATA: Record<QnaKey, { text: string; url: string }> = {
  gst: {
    text: "To file your GST return, head to the official GST Portal — you'll file GSTR-1 (outward supplies) and GSTR-3B (summary return) there using your GSTIN login.",
    url: "https://www.gst.gov.in/",
  },
  eway: {
    text: "An e-way bill is required whenever you're moving goods worth over ₹50,000. Generate it directly on the official e-Way Bill Portal using your GSTIN.",
    url: "https://ewaybillgst.gov.in/",
  },
  itr: {
    text: "Income tax returns are filed on the official Income Tax e-Filing portal using your PAN — it also shows your Form 26AS tax credit statement.",
    url: "https://www.incometax.gov.in/",
  },
  udyam: {
    text: "Registering as an MSME is free and paperless on the Udyam Registration portal — you'll just need your Aadhaar and PAN details.",
    url: "https://udyamregistration.gov.in/",
  },
};

const QUICK_QUESTIONS: { key: QnaKey; label: string }[] = [
  { key: "gst", label: "How do I file GST?" },
  { key: "eway", label: "How do I generate an e-way bill?" },
  { key: "itr", label: "How do I file income tax?" },
  { key: "udyam", label: "How do I register my business as an MSME?" },
];

const LINK_CARDS = [
  {
    icon: "₹",
    title: "GST Portal",
    desc: "Register for GST, file GSTR-1/3B returns, make payments, and track refunds — the main government portal for everything GST.",
    url: "https://www.gst.gov.in/",
    domain: "gst.gov.in",
  },
  {
    icon: "🚚",
    title: "e-Way Bill Portal",
    desc: "Generate the electronic waybill required whenever you move goods worth more than ₹50,000.",
    url: "https://ewaybillgst.gov.in/",
    domain: "ewaybillgst.gov.in",
  },
  {
    icon: "📄",
    title: "Income Tax e-Filing",
    desc: "File your income tax return, check refund status, and view your Form 26AS tax credit statement.",
    url: "https://www.incometax.gov.in/",
    domain: "incometax.gov.in",
  },
  {
    icon: "🏭",
    title: "Udyam Registration",
    desc: "Register your business as an MSME, free and paperless — unlocks credit, subsidy, and delayed-payment protections.",
    url: "https://udyamregistration.gov.in/",
    domain: "udyamregistration.gov.in",
  },
];

const RUPEE_POSITIONS = [
  { top: "6%", left: "8%", size: "70px", delay: "0s" },
  { top: "18%", left: "82%", size: "90px", delay: "1.5s" },
  { top: "40%", left: "20%", size: "60px", delay: "0.7s" },
  { top: "55%", left: "70%", size: "110px", delay: "2.2s" },
  { top: "72%", left: "12%", size: "80px", delay: "1s" },
  { top: "85%", left: "60%", size: "65px", delay: "2.8s" },
  { top: "30%", left: "50%", size: "50px", delay: "0.3s" },
  { top: "95%", left: "88%", size: "75px", delay: "1.8s" },
];

function qnaMatch(text: string): QnaKey {
  const t = text.toLowerCase();
  if (t.includes("e-way") || t.includes("eway") || t.includes("transport") || t.includes("goods")) return "eway";
  if (t.includes("udyam") || t.includes("msme") || t.includes("register my business")) return "udyam";
  if (t.includes("income") || t.includes("itr") || t.includes("tax")) return "itr";
  return "gst";
}

export default function ResourcesPage() {
  const [input, setInput] = useState("");
  const [answerKey, setAnswerKey] = useState<QnaKey | null>(null);

  function ask(key?: QnaKey, label?: string) {
    if (label) setInput(label);
    setAnswerKey(key ?? qnaMatch(input));
  }

  const answer = answerKey ? QNA_DATA[answerKey] : null;

  return (
    <div className="relative">
      <div className="rupee-bg pointer-events-none absolute inset-x-0 top-0 z-0 h-full min-h-[600px] overflow-hidden">
        {RUPEE_POSITIONS.map((p, i) => (
          <span
            key={i}
            className="absolute font-serif text-amber opacity-[0.07]"
            style={{
              top: p.top,
              left: p.left,
              fontSize: p.size,
              animation: `rupeeDrift 12s ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          >
            ₹
          </span>
        ))}
      </div>

      <div className="relative z-[1]">
        <h1 className="font-serif text-[26px] font-medium">Resources</h1>
        <p className="mb-7 text-sm text-ink-soft">
          Straight answers and the official government links to go with them.
        </p>

        <div className="mb-7 rounded-[16px] border border-line bg-surface p-9 shadow-sm sm:p-[38px]">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Ask a quick question
          </div>
          <div className="mb-5 font-serif text-2xl font-medium">
            What do you need help with?
          </div>
          <div className="mb-4 flex gap-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="e.g. How do I file my GST return?"
              className="flex-1 rounded-2xl border border-line bg-bg px-5 py-4 text-base outline-none focus:border-amber"
            />
            <button
              onClick={() => ask()}
              className="shrink-0 rounded-2xl bg-ink px-[26px] text-base font-semibold text-bg"
            >
              Ask
            </button>
          </div>
          <div className="mb-1.5 flex flex-wrap gap-2.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.key}
                onClick={() => ask(q.key, q.label)}
                className="rounded-full border border-line bg-surface-2 px-4 py-[9px] text-sm transition hover:border-amber"
              >
                {q.label}
              </button>
            ))}
          </div>

          {answer && (
            <div className="mt-[22px] rounded-2xl bg-surface-2 px-6 py-[22px]">
              <p className="mb-4 text-[17px] leading-relaxed">{answer.text}</p>
              <a
                href={answer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-[22px] py-3 text-[15px] font-semibold text-bg"
              >
                Go to the official portal →
              </a>
            </div>
          )}
        </div>

        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Official links, recommended by the crew
        </div>
        <div className="mb-7 grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          {LINK_CARDS.map((card) => (
            <a
              key={card.domain}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[20px] border border-line bg-surface p-[26px] shadow-sm transition hover:-translate-y-0.5 hover:border-amber"
            >
              <div className="mb-4 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-amber-soft font-serif text-[22px] font-semibold text-amber">
                {card.icon}
              </div>
              <h4 className="mb-2 font-serif text-[19px] font-medium">{card.title}</h4>
              <p className="mb-2.5 text-[14.5px] leading-relaxed text-ink-soft">{card.desc}</p>
              <div className="font-mono text-xs text-amber">{card.domain}</div>
            </a>
          ))}
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-8 shadow-sm sm:p-[34px]">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Show your work
            </div>
            <h2 className="font-serif text-[17px] font-medium">
              How Compliance calculated this month&apos;s GST
            </h2>
          </div>
          {[
            ["Taxable value (Sharma Textiles, INV-0412)", "₹42,000.00"],
            ["CGST (9%)", "₹3,780.00"],
            ["SGST (9%)", "₹3,780.00"],
            ["HSN code matched", "9983"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-dashed border-line py-3 text-[15px]"
            >
              <span>{label}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t-2 border-ink pt-4 text-[16.5px] font-semibold">
            <span>Total GST payable on this invoice</span>
            <span className="font-mono">₹7,560.00</span>
          </div>
          <div className="mt-[18px] rounded-[10px] bg-surface-2 px-[18px] py-3.5 text-[13.5px] leading-relaxed text-ink-soft">
            This is the exact breakdown Compliance used before adding this
            invoice to your GSTR-3B draft — nothing here is estimated or
            rounded silently. If a number ever looks wrong, this is the box
            to check first.
          </div>
        </div>
      </div>
    </div>
  );
}
