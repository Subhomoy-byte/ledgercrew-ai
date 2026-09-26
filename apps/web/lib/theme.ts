export type ThemeChoice = "light" | "dark" | "system";

const THEME_KEY = "lc-theme";

export function getStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice, persist: boolean) {
  if (typeof document === "undefined") return;
  if (choice === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else if (choice === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  if (persist) {
    try {
      if (choice === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, choice);
    } catch {
      // localStorage unavailable — theme still applies for this session
    }
  }
}

export function isEffectivelyDark(choice: ThemeChoice): boolean {
  if (choice === "dark") return true;
  if (choice === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
