import { useEffect, useState } from "react";

// Light or dark. Light is the default; once you tap the button the choice is saved (localStorage "theme")
// and kept. index.html applies it before paint.
type Theme = "light" | "dark";
const THEME_COLOR: Record<Theme, string> = { light: "#f6f5ee", dark: "#292a23" };

const current = (): Theme => {
  const set = document.documentElement.getAttribute("data-theme");
  return set === "dark" ? "dark" : "light";
};
const paintBar = (t: Theme) => document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[t]);

// withLabel: the row inside the small-screen Menu (icon and words); without it, the round button in the header.
export default function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    paintBar(theme);
  }, [theme]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    // Ease the colours over for a moment (styles.css .theme-changing), unless motion is turned down.
    const root = document.documentElement;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("theme-changing");
      window.setTimeout(() => root.classList.remove("theme-changing"), 450);
    }
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch { /* private mode: lasts until the page closes */ }
    setTheme(next);
  }

  const dark = theme === "dark";
  return (
    <button type="button" className={withLabel ? "theme-toggle theme-row" : "theme-toggle"} onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
      {dark ? (
        <svg key="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg key="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
      {withLabel && (dark ? "Light mode" : "Dark mode")}
    </button>
  );
}
