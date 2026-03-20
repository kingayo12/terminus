/**
 * @module modules/theme
 * @description Manages application colour themes and dark-mode toggling.
 *
 * Usage:
 *   import { initTheme, initThemeManager } from './modules/theme.js';
 *   initTheme();
 *   initThemeManager();
 */

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Replaces every non-dark-mode class on <body> with newTheme, then
 * re-applies dark-mode if it was previously enabled.
 * @param {string} newTheme - Sanitised theme class name (e.g. "theme-blue").
 */
function replaceThemeClass(newTheme) {
  const { classList } = document.body;

  // Remove all classes that are not dark-mode
  Array.from(classList)
    .filter((cls) => cls !== "dark-mode")
    .forEach((cls) => classList.remove(cls));

  classList.add(newTheme);

  // Re-apply dark mode from storage so it isn't lost on theme switch
  const isDark = localStorage.getItem("darkMode") === "true";
  classList.toggle("dark-mode", isDark);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Applies a colour theme with an optional fade animation.
 * @param {string} theme  - Raw theme name from data-content (e.g. "Theme One").
 * @param {boolean} [animate=true] - Whether to fade during transition.
 */
export function applyTheme(theme, animate = true) {
  const safeTheme = theme.trim().toLowerCase().replace(/\s+/g, "-");

  if (!animate) {
    replaceThemeClass(safeTheme);
    return;
  }

  document.body.classList.add("theme-transition");
  document.body.style.opacity = "0";

  setTimeout(() => {
    replaceThemeClass(safeTheme);
    document.body.style.opacity = "1";
    setTimeout(() => document.body.classList.remove("theme-transition"), 300);
  }, 300);
}

/**
 * Reads the saved colour theme from localStorage and binds click handlers
 * on every `.boxTheme1` element.
 * Call this after page content is injected.
 */
export function initTheme() {
  const saved = localStorage.getItem("selectedTheme");
  if (saved) {
    applyTheme(saved, false);
    document.dispatchEvent(new Event("theme-changed"));
  }

  document.querySelectorAll(".boxTheme1").forEach((box) => {
    box.addEventListener("click", () => {
      const theme = box.getAttribute("data-content");
      localStorage.setItem("selectedTheme", theme);
      applyTheme(theme, true);
      document.dispatchEvent(new Event("theme-changed"));
    });
  });
}

/**
 * Wires up the dark-mode toggle button and the optional theme-select
 * dropdown (light / dark / system).
 * Call this after the header component is injected.
 */
export function initThemeManager() {
  const body = document.body;
  const toggle = document.querySelector(".toggle_theme");
  const select = document.getElementById("themeSelect");

  if (!toggle && !select) return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function applyDarkMode(isDark, persist = true) {
    body.classList.toggle("dark-mode", isDark);
    toggle?.classList.toggle("dark", isDark);
    toggle?.setAttribute("aria-checked", String(isDark));

    if (select && select.value !== "system") {
      select.value = isDark ? "dark" : "light";
    }

    if (persist) localStorage.setItem("darkMode", String(isDark));

    // Let charts.js know so it can re-render with updated grid/text colours
    document.dispatchEvent(new Event("darkmode-changed"));
  }

  function applySystemMode() {
    applyDarkMode(mediaQuery.matches, false);
    if (select) select.value = "system";
    localStorage.removeItem("darkMode");
  }

  // ── Initial state ──────────────────────────────────────────────────────────
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") applyDarkMode(true);
  else if (saved === "false") applyDarkMode(false);
  else applySystemMode();

  // ── Toggle button ──────────────────────────────────────────────────────────
  toggle?.addEventListener("click", () => {
    const isDark = !body.classList.contains("dark-mode");
    applyDarkMode(isDark);
    if (select) select.value = isDark ? "dark" : "light";
  });

  // ── Dropdown ───────────────────────────────────────────────────────────────
  select?.addEventListener("change", () => {
    if (select.value === "dark") applyDarkMode(true);
    else if (select.value === "light") applyDarkMode(false);
    else applySystemMode();
  });

  // ── OS-level change ────────────────────────────────────────────────────────
  mediaQuery.addEventListener("change", (e) => {
    if (select?.value === "system") applyDarkMode(e.matches, false);
  });
}
