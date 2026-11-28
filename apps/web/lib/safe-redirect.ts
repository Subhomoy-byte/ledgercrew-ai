// Decides where to send someone after they sign in. The destination arrives in
// a URL parameter (?next=...), which anyone can craft, so it must never be able
// to send a person to a different website ("open redirect").
//
// A plain startsWith("/") check is NOT enough: "//evil.com" starts with a slash
// but is a different site, and URL parsers also turn "/\evil.com" or a slash
// followed by a tab into "//evil.com". So: reject those shapes outright, then
// let the real URL parser have the final say.

const SAFE_BASE = "http://safe-redirect.invalid";
const MAX_LENGTH = 2048;

export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next || next.length > MAX_LENGTH) return fallback;
  if (!next.startsWith("/")) return fallback; // must be a path on this site
  if (next.startsWith("//")) return fallback; // "//evil.com" is another site

  for (let i = 0; i < next.length; i++) {
    const c = next.charCodeAt(i);
    // control characters (tab, newline...) and backslashes get normalised
    // into slashes by browsers and URL parsers
    if (c < 0x20 || c === 0x7f || c === 0x5c) return fallback;
  }

  try {
    const url = new URL(next, SAFE_BASE);
    if (url.origin !== SAFE_BASE) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
