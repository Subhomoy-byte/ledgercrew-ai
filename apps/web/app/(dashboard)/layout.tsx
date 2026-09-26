"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { applyTheme, getStoredTheme, isEffectivelyDark } from "@/lib/theme";

const TABS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Your Profile", href: "/profile" },
  { label: "Ledger", href: "/ledger" },
  { label: "Collections", href: "/collections" },
  { label: "Crew", href: "/crew" },
  { label: "Privacy", href: "/privacy" },
  { label: "Resources", href: "/resources" },
  { label: "Settings", href: "/settings" },
];

const DUTY = [
  { name: "Intake", status: "working" as const },
  { name: "Compliance", status: "done" as const },
  { name: "Collections", status: "working" as const },
  { name: "Guardrail", status: "idle" as const },
  { name: "Cash-flow", status: "done" as const },
];

function DutyDot({ status }: { status: "working" | "done" | "idle" }) {
  const base = "relative h-[7px] w-[7px] rounded-full";
  if (status === "working") {
    return (
      <span className={`${base} bg-amber`}>
        <span className="absolute -inset-1 animate-[ring_1.6s_ease-out_infinite] rounded-full border-[1.5px] border-amber" />
      </span>
    );
  }
  if (status === "done") return <span className={`${base} bg-green`} />;
  return <span className={`${base} bg-ink-soft`} />;
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [themeIcon, setThemeIcon] = useState<string | null>(null);

  useEffect(() => {
    setThemeIcon(isEffectivelyDark(getStoredTheme()) ? "☀️" : "🌙");
  }, []);

  function toggleTheme() {
    const goingDark = !isEffectivelyDark(getStoredTheme());
    applyTheme(goingDark ? "dark" : "light", true);
    setThemeIcon(goingDark ? "☀️" : "🌙");
  }

  useEffect(() => {
    const activeTab = tabRefs.current[pathname];
    const container = tabsRef.current;
    const indicator = indicatorRef.current;
    if (!activeTab || !container || !indicator) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    gsap.to(indicator, {
      x: activeTab.offsetLeft,
      width: activeTab.offsetWidth,
      duration: reduceMotion ? 0 : 0.45,
      ease: "power3.out",
    });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-20 flex items-center gap-7 border-b border-line bg-bg/80 px-6 py-5 backdrop-blur-md sm:px-11">
        <div className="font-serif text-[19px] font-medium tracking-tight">
          Ledger<span className="text-amber">Crew</span>
        </div>

        <div ref={tabsRef} className="relative ml-2 flex gap-1">
          <div
            ref={indicatorRef}
            className="absolute top-0 h-full rounded-full bg-ink"
            style={{ width: 0 }}
          />
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                ref={(el) => {
                  tabRefs.current[tab.href] = el;
                }}
                className={`relative z-[1] rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
                  active ? "text-bg" : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />
        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-[15px] transition hover:border-amber"
        >
          {themeIcon ?? " "}
        </button>
        <button className="rounded-full bg-ink px-[18px] py-2.5 text-[13.5px] font-medium text-bg">
          Upload invoice
        </button>
      </nav>

      <div className="flex flex-wrap gap-2.5 border-b border-line px-6 py-3 sm:px-11">
        {DUTY.map((agent) => (
          <span
            key={agent.name}
            className="flex items-center gap-[7px] rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-soft"
          >
            <DutyDot status={agent.status} />
            {agent.name} — {agent.status}
          </span>
        ))}
      </div>

      <main className="mx-auto max-w-[1180px] px-6 py-10 sm:px-11">{children}</main>
    </div>
  );
}
