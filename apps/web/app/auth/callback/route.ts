import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";

// Where Google sends people back to (via Supabase) after they approve sign-in.
// The URL carries a one-time `code`; swapping it for a real session happens
// here, on the server, and the session is stored in cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const to = (path: string) => NextResponse.redirect(new URL(path, origin));
  const failed = (reason: "oauth_denied" | "oauth_failed") =>
    to(`/login?error=${reason}`);

  // Google/Supabase report a refusal (e.g. the person pressed Cancel) as ?error=
  if (searchParams.get("error")) return failed("oauth_denied");

  const code = searchParams.get("code");
  if (!code) return failed("oauth_failed");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return failed("oauth_failed");

  return to(safeNextPath(searchParams.get("next")));
}
