"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Stage = {
  title: string;
  desc: string;
  tag?: string;
  active: boolean;
};

const STAGES: Stage[] = [
  {
    title: "Friendly nudge sent",
    desc: '"Hope you\'re doing well — just a gentle note that INV-0417 is now a few days past due."',
    tag: "Sent Tue, 9:02 AM",
    active: true,
  },
  {
    title: "Firmer follow-up — reviewed and approved",
    desc: "Guardrail checked the draft for tone before it went out. No changes needed.",
    tag: "Sent today, 8:41 AM",
    active: true,
  },
  {
    title: "Final notice — scheduled",
    desc: "Will send in 3 days if payment hasn't come through.",
    active: false,
  },
];

export default function CollectionsPage() {
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const stages = stageRefs.current.filter(Boolean);
    if (stages.length) {
      gsap.fromTo(
        stages,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: reduceMotion ? 0 : 0.5,
          stagger: reduceMotion ? 0 : 0.15,
          delay: reduceMotion ? 0 : 0.1,
          ease: "power3.out",
        }
      );
    }
    const lines = lineRefs.current.filter(Boolean);
    if (lines.length) {
      gsap.fromTo(
        lines,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: reduceMotion ? 0 : 0.5,
          stagger: reduceMotion ? 0 : 0.15,
          delay: reduceMotion ? 0 : 0.25,
          transformOrigin: "top",
          ease: "power3.out",
        }
      );
    }
  }, []);

  return (
    <>
      <h1 className="font-serif text-[26px] font-medium">Collections</h1>
      <p className="mb-7 text-sm text-ink-soft">
        Every reminder is drafted, then checked, before it goes out.
      </p>

      <div className="rounded-[16px] border border-line bg-surface shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-line px-[22px] py-[18px]">
          <h2 className="font-serif text-[17px] font-medium">Bose Digital Studio</h2>
          <span className="mt-[3px] text-[12.5px] text-ink-soft">
            ₹28,500 · 6 days overdue
          </span>
        </div>

        <div className="px-[22px] py-5">
          {STAGES.map((stage, i) => (
            <div
              key={stage.title}
              ref={(el) => { stageRefs.current[i] = el; }}
              className="flex gap-3.5"
            >
              <div className="flex flex-col items-center">
                <span
                  className={`h-[10px] w-[10px] shrink-0 rounded-full border-2 ${
                    stage.active ? "border-amber bg-amber" : "border-line bg-line"
                  }`}
                />
                {i < STAGES.length - 1 && (
                  <div
                    ref={(el) => { lineRefs.current[i] = el; }}
                    className={`my-0.5 min-h-[34px] w-0.5 flex-1 ${
                      stage.active ? "bg-amber" : "bg-line"
                    }`}
                  />
                )}
              </div>
              <div className="pb-5">
                <div className="text-[13.5px] font-medium">{stage.title}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-soft">{stage.desc}</div>
                {stage.tag && (
                  <span className="mt-1.5 inline-block rounded-md bg-surface-2 px-2 py-[3px] text-[11px] text-ink-soft">
                    {stage.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-[22px] mb-[22px] flex items-center gap-3.5 rounded-[14px] border border-green bg-green-soft px-5 py-4 text-[13.5px]">
          <span>💬</span>
          <span>
            Clients can send invoices straight from WhatsApp — forward a photo
            to <span className="font-mono font-medium">+91 98XXX-XXXXX</span>.
          </span>
        </div>
      </div>
    </>
  );
}
