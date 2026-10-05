"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "error" | "info";
  message: string | null;
};

export const initialAuthState: AuthState = { status: "idle", message: null };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  return { email, password };
}

export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { status: "error", message: "Enter both your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { status: "error", message: "Enter both your email and password." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { status: "error", message: error.message };
  }

  // If the project has email confirmation on (Supabase's default), signUp
  // succeeds but returns no session yet — the account exists, pending
  // confirmation. If confirmation is off, a session comes back immediately.
  if (data.user && !data.session) {
    return {
      status: "info",
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  redirect("/dashboard");
}
