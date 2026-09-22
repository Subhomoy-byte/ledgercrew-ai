"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // TODO(Step: backend/auth): wire this to real Supabase auth.
  // For now every sign-in path just navigates through so the rest of the
  // app is reachable and testable while the real backend doesn't exist yet.
  function handleSignIn(e?: FormEvent) {
    e?.preventDefault();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-[400px] rounded-[22px] border border-line bg-surface p-10 shadow-sm">
        <div className="mb-6 text-[13.5px] font-medium uppercase tracking-wider text-ink-soft">
          LedgerCrew<span className="text-amber"> AI</span>
        </div>

        <h1 className="mb-1.5 font-serif text-[27px] font-medium tracking-tight">
          Welcome back, boss.
        </h1>
        <p className="mb-7 text-[13.5px] text-ink-soft">
          Your crew kept working while you were away.
        </p>

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
