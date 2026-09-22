"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" className="shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

const CREW_INITIALS = ["In", "Co", "Cl", "Gu", "Ca"];
const WAVE_TEXT = "Welcome back, boss.";
const SUB_TEXT = "Your crew kept working while you were away.";
const FLOAT_POSITIONS = [
  { top: "14%", left: "12%", delay: "0s", initial: "In" },
  { top: "22%", left: "82%", delay: "1.2s", initial: "Co" },
  { top: "70%", left: "16%", delay: "2.1s", initial: "Cl" },
  { top: "68%", left: "84%", delay: "0.6s", initial: "Gu" },
  { top: "48%", left: "6%", delay: "1.7s", initial: "Ca" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  function handleSignIn(e?: FormEvent) {
    e?.preventDefault();
    // TODO(Step: backend/auth): wire this to real Supabase auth.
    router.push("/dashboard");
  }

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vantaEffect: any = null;
    let cancelled = false;

    // ---- typed brand name, then the wave headline, then the typewriter subtitle ----
    function startWave() {
      if (!waveRef.current) return;
      waveRef.current.innerHTML = "";
      WAVE_TEXT.split("").forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch === " " ? "\u00A0" : ch;
        span.style.display = "inline-block";
        span.style.animation = reduceMotion ? "none" : "wave 2.6s ease-in-out infinite";
        span.style.animationDelay = `${i * 0.045}s`;
        waveRef.current!.appendChild(span);
      });
    }

    function typeSub() {
      if (!subRef.current) return;
      if (reduceMotion) {
        subRef.current.textContent = SUB_TEXT;
        return;
      }
      let i = 0;
      const tick = () => {
        if (cancelled || !subRef.current) return;
        subRef.current.textContent = SUB_TEXT.slice(0, i);
        i++;
        if (i <= SUB_TEXT.length) setTimeout(tick, 32);
      };
      setTimeout(tick, 150);
    }

    function typeBrand() {
      if (!brandRef.current) return;
      const main = "LedgerCrew";
      const tag = " AI";
      if (reduceMotion) {
        brandRef.current.innerHTML = `${main}<span class="text-amber">${tag}</span>`;
        startWave();
        typeSub();
        return;
      }
      let i = 0;
      const typeMain = () => {
        if (cancelled || !brandRef.current) return;
        brandRef.current.textContent = main.slice(0, i);
        i++;
        if (i <= main.length) {
          setTimeout(typeMain, 60);
        } else {
          i = 0;
          setTimeout(typeTag, 150);
        }
      };
      const typeTag = () => {
        if (cancelled || !brandRef.current) return;
        brandRef.current.innerHTML = `${main}<span class="text-amber">${tag.slice(0, i)}</span>`;
        i++;
        if (i <= tag.length) {
          setTimeout(typeTag, 60);
        } else {
          startWave();
          typeSub();
        }
      };
      setTimeout(typeMain, 300);
    }
    typeBrand();

    // ---- card tilt + spotlight follow the mouse ----
    let rotX: ((v: number) => void) | null = null;
    let rotY: ((v: number) => void) | null = null;
    function handleMouseMove(e: MouseEvent) {
      const card = cardRef.current;
      if (!card || !rotX || !rotY) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      rotY((px - 0.5) * 14);
      rotX((0.5 - py) * 14);
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    }
    function handleMouseLeave() {
      rotX?.(0);
      rotY?.(0);
    }

    if (!reduceMotion && cardRef.current) {
      cardRef.current.style.transformStyle = "preserve-3d";
      rotX = gsap.quickTo(cardRef.current, "rotationX", { duration: 0.5, ease: "power3.out" });
      rotY = gsap.quickTo(cardRef.current, "rotationY", { duration: 0.5, ease: "power3.out" });
      cardRef.current.addEventListener("mousemove", handleMouseMove);
      cardRef.current.addEventListener("mouseleave", handleMouseLeave);
    }

    // ---- Vanta HALO glowing background ----
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
        amplitudeFactor: 2.0,
        size: 1.6,
        xOffset: 0.1,
      });
    }
    initVanta();

    return () => {
      cancelled = true;
      cardRef.current?.removeEventListener("mousemove", handleMouseMove);
      cardRef.current?.removeEventListener("mouseleave", handleMouseLeave);
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 py-12">
      <div ref={vantaRef} className="pointer-events-none absolute inset-0 z-0" />

      {FLOAT_POSITIONS.map((f) => (
        <div
          key={f.initial}
          className="login-float absolute z-[1] flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface font-serif text-sm text-ink-soft shadow-sm"
          style={{ top: f.top, left: f.left, animation: `floatyGlow 6s ease-in-out infinite`, animationDelay: f.delay }}
        >
          {f.initial}
        </div>
      ))}

      <div
        ref={cardRef}
        className="login-card relative z-[2] w-full max-w-[400px] overflow-hidden rounded-[22px] border border-line bg-surface p-10 shadow-sm"
      >
        <div
          ref={brandRef}
          className="mb-6 min-h-[17px] text-[13.5px] font-medium uppercase tracking-wider text-ink-soft"
        />

        <h1 ref={waveRef} className="login-wave mb-1.5 font-serif text-[27px] font-medium tracking-tight" />
        <p ref={subRef} className="mb-7 min-h-[20px] text-[13.5px] text-ink-soft" />

        <button
          type="button"
          onClick={handleSignIn}
          className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-[#dadce0] bg-white py-3 text-[13.5px] font-medium text-[#3c4043] transition hover:shadow-md"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={handleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface py-3 text-[13.5px] font-medium text-ink transition hover:border-green"
        >
          💬 Continue with WhatsApp
        </button>

        <div className="my-5 flex items-center gap-3 text-[11.5px] text-ink-soft">
          <span className="h-px flex-1 bg-line" />
          or sign in with email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-xs text-ink-soft">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 text-[13.5px] text-ink outline-none transition focus:border-amber"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-xs text-ink-soft">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 text-[13.5px] text-ink outline-none transition focus:border-amber"
            />
          </div>
          <button
            type="submit"
            className="mt-1.5 w-full rounded-full bg-ink py-3.5 text-[13.5px] font-medium text-bg"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          {CREW_INITIALS.map((initial) => (
            <div
              key={initial}
              className="-ml-2 flex h-[26px] w-[26px] items-center justify-center rounded-lg border-2 border-surface bg-surface-2 font-mono text-[10.5px] text-ink-soft"
            >
              {initial}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
