"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Agent = {
  id: string;
  initials: string;
  name: string;
  role: string;
  status: string;
  working: boolean;
  trace: string;
};

const AGENTS: Agent[] = [
  {
    id: "intake",
    initials: "In",
    name: "Intake",
    role: "Reads invoices & receipts",
    status: "Currently reading a new upload",
    working: true,
    trace:
      "Reading INV-0431.jpg → detected vendor 'Ray Consulting', amount ₹31,500, date 24 Sep → confidence 96% → handing off to Compliance.",
  },
  {
    id: "compliance",
    initials: "Co",
    name: "Compliance",
    role: "GST classification & filing",
    status: "Idle — last ran 4 min ago",
    working: false,
    trace:
      "Checked HSN 9983 against GSTR-1 schema → no mismatch → invoice cleared for filing → draft return updated.",
  },
  {
    id: "collections",
    initials: "Cl",
    name: "Collections",
    role: "Drafts payment reminders",
    status: "Drafting a reminder now",
    working: true,
    trace:
      "Drafting reminder #2 for Sharma Textiles → tone: firm, no threats → sending to Guardrail for review before dispatch.",
  },
  {
    id: "guardrail",
    initials: "Gu",
    name: "Guardrail",
    role: "Reviews tone before sending",
    status: "Waiting on next draft",
    working: false,
    trace:
      "Reviewed Collections' draft for Bose Digital Studio → flagged one line as too curt → suggested softer phrasing → re-sent for approval.",
  },
  {
    id: "cashflow",
    initials: "Ca",
    name: "Cash-flow",
    role: "Forecasts your next 90 days",
    status: "Idle — last ran 2 min ago",
    working: false,
    trace:
      "Recalculated 30-day forecast after 3 new invoices → payroll on the 30th still covered → flagged Oct 12–14 as tightest window.",
  },
];

const FORECAST_BARS = [52, 64, 48, 70, 85, 78, 92];
const FORECAST_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"];

export default function CrewPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [typedTrace, setTypedTrace] = useState("");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: reduceMotion ? 0 : 0.5,
          stagger: reduceMotion ? 0 : 0.08,
          ease: "power3.out",
        }
      );
    }
    const bars = barRefs.current.filter(Boolean);
    if (bars.length) {
      gsap.fromTo(
        bars,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: reduceMotion ? 0 : 0.7,
          stagger: reduceMotion ? 0 : 0.06,
          delay: reduceMotion ? 0 : 0.15,
          transformOrigin: "bottom",
          ease: reduceMotion ? "power1.out" : "elastic.out(1,0.7)",
        }
      );
    }
  }, []);

  function toggleCard(agent: Agent) {
    if (typeTimeout.current) clearTimeout(typeTimeout.current);
    if (openId === agent.id) {
      setOpenId(null);
      setTypedTrace("");
      return;
    }
    setOpenId(agent.id);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      setTypedTrace(agent.trace);
      return;
    }
    let i = 0;
    setTypedTrace("");
    const type = () => {
      i += 2;
      setTypedTrace(agent.trace.slice(0, i));
      if (i <= agent.trace.length) {
        typeTimeout.current = setTimeout(type, 8);
      }
    };
    type();
  }

  return (
    <>
      <h1 className="font-serif text-[26px] font-medium">Crew</h1>
      <p className="mb-7 text-sm text-ink-soft">
        Click an agent to see what it&apos;s thinking.
      </p>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent, i) => {
          const isOpen = openId === agent.id;
          return (
            <div
              key={agent.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              onClick={() => toggleCard(agent)}
              className="cursor-pointer overflow-hidden rounded-[16px] border border-line bg-surface p-[22px] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 font-serif text-base">
                  {agent.initials}
                  {agent.working && (
                    <span className="absolute -inset-1 animate-[ring2_2s_ease-in-out_infinite] rounded-[14px] border-2 border-amber" />
                  )}
                </div>
                <div>
                  <div className="text-[14.5px] font-semibold">{agent.name}</div>
                  <div className="text-xs text-ink-soft">{agent.role}</div>
                </div>
              </div>
              <div className="mt-3.5 text-[12.5px] text-ink-soft">{agent.status}</div>
              <div
                className={`overflow-hidden border-t border-dashed border-line text-[12.5px] text-ink-soft transition-[max-height] duration-[450ms] ease-in-out ${
                  isOpen ? "mt-3.5 max-h-40 pt-3" : "mt-0 max-h-0 border-t-0"
                }`}
              >
                {isOpen ? typedTrace : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-[22px] py-[18px]">
          <h2 className="font-serif text-[17px] font-medium">90-day forecast</h2>
        </div>
        <div className="flex h-[180px] items-end gap-2.5 px-[22px] py-6">
          {FORECAST_BARS.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                ref={(el) => { barRefs.current[i] = el; }}
                className="w-full rounded-t-md bg-green"
                style={{ height: `${h}%` }}
              />
              <div className="text-[11px] text-ink-soft">{FORECAST_LABELS[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
