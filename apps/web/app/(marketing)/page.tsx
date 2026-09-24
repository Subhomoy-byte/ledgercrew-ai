"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const PAIN_POINTS = [
  { num: "01", title: "GST, every quarter", desc: "Sorting invoices by HSN code and hoping nothing's missing before the filing window closes." },
  { num: "02", title: '"Clients who forget"', desc: "Writing the same awkward follow-up message, over and over, to people who owe you money." },
  { num: "03", title: "Not knowing your number", desc: "Payroll's in ten days. Will three overdue invoices land in time? Nobody's sure." },
];

const CREW = [
  { letter: "In", name: "Intake", desc: "Reads invoices and receipts — photos, PDFs, forwarded on WhatsApp.", trace: "→ extracted ₹15,000, due 20 Sep, conf. 96%" },
  { letter: "Co", name: "Compliance", desc: "Classifies GST, flags mismatches, drafts your return.", trace: "→ HSN 9983 matched, no mismatch found" },
  { letter: "Cl", name: "Collections", desc: "Drafts staged reminders as invoices age — polite, then firm.", trace: "→ drafted reminder #2 for Sharma Textiles" },
  { letter: "Gu", name: "Guardrail", desc: "Checks every reminder's tone before it ever gets sent.", trace: "→ flagged line 2 as too curt, softened it" },
  { letter: "Ca", name: "Cash-flow", desc: "Forecasts the next 90 days so surprises stop being surprises.", trace: "→ payroll on the 30th: covered" },
];

const DIFFERENTIATORS = [
  { tag: "Zero setup", title: "Forward a photo on WhatsApp", desc: "No app to open. Send an invoice photo to your business number the same way you already send everything else." },
  { tag: "Transparent", title: "Watch the crew think", desc: "Every decision — extracted, flagged, drafted, approved — shows up live. Nothing happens in a black box." },
  { tag: "Gets smarter", title: "Know who actually pays on time", desc: "See a client's payment reliability before you even send the invoice, built from real patterns across businesses like yours." },
  { tag: "Speaks your language", title: "Ask it out loud, in Hindi or Bengali", desc: "A voice note asking what's owed this month gets a spoken answer back — no dashboard required." },
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vantaEffect: any = null;
    let cancelled = false;

    if (heroRef.current) {
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 24,
        duration: reduceMotion ? 0 : 0.9,
        ease: "power3.out",
        delay: reduceMotion ? 0 : 0.2,
      });
    }

    async function initVanta() {
      if (reduceMotion || !vantaRef.current) return;
      const THREE = await import("three");
      const HALO = (await import("vanta/dist/vanta.halo.min")).default;
      if (cancelled) return;
      vantaEffect = HALO({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        baseColor: 0xdf9e3d,
        backgroundColor: 0x0c1210,
        amplitudeFactor: 1.6,
        size: 1.4,
        xOffset: 0.05,
      });
    }
    initVanta();

    const revealEls = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${(i % 6) * 0.06}s`;
      io.observe(el);
    });

    return () => {
      cancelled = true;
      if (vantaEffect) vantaEffect.destroy();
      io.disconnect();
    };
  }, []);

  return (
    <div className="bg-bg text-ink">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/80 px-6 py-5 backdrop-blur-md sm:px-8">
        <div className="font-serif text-[19px] font-medium">
          Ledger<span className="text-amber">Crew</span>
        </div>
        <div className="flex gap-2.5">
          <a href="/login" className="rounded-full border border-line px-5 py-[11px] text-[13.5px] font-medium">
            Sign in
          </a>
          <a href="/login" className="rounded-full bg-ink px-5 py-[11px] text-[13.5px] font-medium text-bg">
            Get started free
          </a>
        </div>
      </nav>

      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <div ref={vantaRef} className="absolute inset-0 z-0 opacity-90" />
        <div ref={heroRef} className="relative z-[1] mx-auto max-w-[720px] px-8 py-20 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12.5px] text-ink-soft">
            🟢 Free while you&apos;re getting started
          </div>
          <h1 className="mb-[22px] font-serif text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[58px]">
            Five agents. One ledger.{" "}
            <em className="text-amber not-italic">Nobody chases payments alone anymore.</em>
          </h1>
          <p className="mx-auto mb-[34px] max-w-[52ch] text-[17px] text-ink-soft">
            LedgerCrew reads your invoices, files your GST paperwork, and
            chases late payers — while you get a two-line brief each morning
            instead of a stack of admin.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <a href="/login" className="rounded-full bg-ink px-[26px] py-[14px] text-[14.5px] font-medium text-bg">
              Get started free
            </a>
            <a href="#crew" className="rounded-full border border-line px-[26px] py-[14px] text-[14.5px] font-medium">
              See it work →
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-8 py-24">
        <div className="mb-2.5 text-[13px] font-medium text-amber">The problem</div>
        <Reveal>
          <h2 className="mb-4 max-w-[20ch] font-serif text-[clamp(26px,3.5vw,36px)] font-medium">
            Running a small business shouldn&apos;t mean running a second,
            unpaid job in admin.
          </h2>
        </Reveal>
        <p className="mb-12 max-w-[56ch] text-[15.5px] text-ink-soft">
          Every month it&apos;s the same three things eating your evenings.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PAIN_POINTS.map((p) => (
            <Reveal key={p.num}>
              <div className="h-full rounded-2xl border border-line bg-surface p-[26px] shadow-sm">
                <div className="font-mono text-xs text-ink-soft">{p.num}</div>
                <h3 className="my-2.5 font-serif text-lg font-medium">{p.title}</h3>
                <p className="text-[13.5px] text-ink-soft">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="crew" className="bg-surface-2 px-8 py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-2.5 text-[13px] font-medium text-amber">Meet the crew</div>
          <Reveal>
            <h2 className="mb-4 font-serif text-[clamp(26px,3.5vw,36px)] font-medium">
              Five specialists. Each one does exactly one job, well.
            </h2>
          </Reveal>
          <p className="mb-12 max-w-[56ch] text-[15.5px] text-ink-soft">
            Hover a card — this is roughly what each one is actually doing
            behind the scenes.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CREW.map((c) => (
              <Reveal key={c.letter}>
                <div className="group rounded-2xl border border-line bg-surface p-[22px] shadow-sm">
                  <div className="mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-surface-2 font-serif text-[22px]">
                    {c.letter}
                  </div>
                  <h4 className="mb-1 text-[14.5px] font-semibold">{c.name}</h4>
                  <p className="mb-2.5 text-[12.5px] text-ink-soft">{c.desc}</p>
                  <div className="translate-y-1.5 border-t border-dashed border-line pt-2 font-mono text-[10.5px] text-ink-soft opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {c.trace}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-8 py-24">
        <div className="mb-2.5 text-[13px] font-medium text-amber">What makes this different</div>
        <Reveal>
          <h2 className="mb-9 font-serif text-[clamp(26px,3.5vw,36px)] font-medium">
            Not another invoice dashboard.
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          {DIFFERENTIATORS.map((d) => (
            <Reveal key={d.title}>
              <div className="h-full rounded-[18px] border border-line bg-surface p-7 shadow-sm">
                <span className="mb-3.5 inline-block rounded-full bg-green-soft px-2.5 py-1 text-[11.5px] text-green">
                  {d.tag}
                </span>
                <h3 className="mb-2 font-serif text-[19px] font-medium">{d.title}</h3>
                <p className="text-[13.5px] text-ink-soft">{d.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-surface-2 px-8 py-24">
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-center gap-10 text-center">
          {[
            ["60M+", "Indian MSMEs filing GST every quarter"],
            ["5", "agents working your ledger at once"],
            ["₹0", "to get started"],
          ].map(([num, label]) => (
            <Reveal key={label}>
              <div className="font-serif text-[34px] text-amber">{num}</div>
              <span className="text-[12.5px] text-ink-soft">{label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-8 py-24">
        <div className="mb-2.5 text-[13px] font-medium text-amber">Pricing</div>
        <Reveal>
          <h2 className="mb-9 font-serif text-[clamp(26px,3.5vw,36px)] font-medium">
            Start free. Pay when it&apos;s actually saving you time.
          </h2>
        </Reveal>
        <div className="grid max-w-[700px] grid-cols-1 gap-5 sm:grid-cols-2">
          <Reveal>
            <div className="rounded-[18px] border border-line bg-surface p-[30px] shadow-sm">
              <div className="mb-1.5 text-[13px] text-ink-soft">Starter</div>
              <div className="font-serif text-[32px]">
                ₹0<small className="font-sans text-[13px] text-ink-soft">/month</small>
              </div>
              <ul className="mt-5 flex flex-col gap-2 text-[13px] text-ink-soft [&_li]:before:mr-1 [&_li]:before:content-['—']">
                <li>Up to 5 invoices/month</li>
                <li>GST compliance checks</li>
                <li>Two reminder stages</li>
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <div className="rounded-[18px] border border-amber bg-surface p-[30px] shadow-sm">
              <div className="mb-1.5 text-[13px] text-ink-soft">Growing business</div>
              <div className="font-serif text-[32px]">
                ₹499<small className="font-sans text-[13px] text-ink-soft">/month</small>
              </div>
              <ul className="mt-5 flex flex-col gap-2 text-[13px] text-ink-soft [&_li]:before:mr-1 [&_li]:before:content-['—']">
                <li>Unlimited invoices</li>
                <li>Full collections sequence</li>
                <li>Cash-flow forecasting</li>
                <li>WhatsApp intake</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-8 py-[110px] text-center">
        <Reveal>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-medium">
            Your crew&apos;s ready when you are.
          </h2>
        </Reveal>
        <Reveal className="mt-6">
          <a href="/login" className="rounded-full bg-ink px-[26px] py-[14px] text-[14.5px] font-medium text-bg">
            Get started free
          </a>
        </Reveal>
      </section>

      <footer className="border-t border-line px-8 py-8 text-center text-[12.5px] text-ink-soft">
        LedgerCrew AI — built for small businesses that would rather run
        their business than their paperwork.
      </footer>
    </div>
  );
}
