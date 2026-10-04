import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes anyone can visit without being logged in. Everything else is
// protected by default — a new route added later is automatically guarded
// unless it's explicitly listed here, which is the safer default.
const PUBLIC_PATHS = ["/", "/login"];

function isPublicPath(pathname: string): boolean {
  // Route Handlers manage their own auth (webhook signatures, etc.) —
  // this middleware shouldn't bounce them to /login.
  if (pathname.startsWith("/api")) return true;
  return PUBLIC_PATHS.includes(pathname);
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  cookieSource: NextResponse
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirect = NextResponse.redirect(url);
  // Carry over any session cookies Supabase just refreshed, so the
  // redirect itself doesn't drop a renewed token.
  cookieSource.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

// Keeps the Supabase auth session cookie fresh on every request, and
// redirects based on whether the visitor is actually logged in. Required
// for @supabase/ssr's cookie-based auth to work correctly across Server
// Components, which cannot themselves write cookies.
export async function middleware(request: NextRequest) {
  // Guard: if Supabase isn't configured yet (.env.local not set up), pass
  // every request through untouched instead of crashing the whole app.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicPath(pathname)) {
    return redirectTo(request, "/login", response);
  }

  if (user && pathname === "/login") {
    return redirectTo(request, "/dashboard", response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
