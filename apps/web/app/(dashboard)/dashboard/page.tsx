"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SPARKLINE_POINTS =
  "0,45 25,42 50,38 75,40 100,30 125,32 150,20 175,18 200,10 220,8";

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

export default function DashboardPage() {
  const heroNumRef = useRef<HTMLSpanElement>(null);
  const sparklineRef = useRef<SVGPolylineElement>(null);
  const kpiRefs = useRef<(HTMLDivElement | null)[]>([]);

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
          ease: "power3.out",
        }
      );
    }
  }, []);

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
            <div ref={(el) => { kpiRefs.current[0] = el; }}>
              <KpiTile label="Overdue" value="3 invoices" flag="warn" />
            </div>
            <div ref={(el) => { kpiRefs.current[1] = el; }}>
              <KpiTile label="GST filing" value="Due in 6 days" flag="amber" />
            </div>
            <div ref={(el) => { kpiRefs.current[2] = el; }}>
              <KpiTile label="Cash position" value="Healthy" flag="ok" />
            </div>
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
    </>
  );
}
