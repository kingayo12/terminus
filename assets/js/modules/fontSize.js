/**
 * @module modules/fontSize
 * @description Manages application-wide font-size scaling via CSS variables.
 *
 * Usage:
 *   import { applyFontSize, initFontSizeSelect } from './modules/fontSize.js';
 *   applyFontSize('default', false); // restore on boot
 *   initFontSizeSelect();            // wire up the <select> on settings page
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** @type {Record<string, Record<string, string>>} */
const FONT_SIZES = {
  default: {
    "--font-size": "10px",
    "--font-size-medium": "12px",
    "--font-size-large": "14px",
    "--font-size-larger": "16px",
  },
  small: {
    "--font-size": "8px",
    "--font-size-medium": "10px",
    "--font-size-large": "12px",
    "--font-size-larger": "14px",
  },
  large: {
    "--font-size": "12px",
    "--font-size-medium": "14px",
    "--font-size-large": "16px",
    "--font-size-larger": "18px",
  },
  xlarge: {
    "--font-size": "14px",
    "--font-size-medium": "16px",
    "--font-size-large": "18px",
    "--font-size-larger": "20px",
  },
};

const STORAGE_KEY = "selectedFontSize";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Applies the given font-size preset to the document root.
 * @param {keyof typeof FONT_SIZES} sizeKey
 * @param {boolean} [save=true] - Whether to persist the choice to localStorage.
 */
export function applyFontSize(sizeKey, save = true) {
  const sizes = FONT_SIZES[sizeKey] ?? FONT_SIZES.default;
  const root = document.documentElement;
  Object.entries(sizes).forEach(([prop, val]) => root.style.setProperty(prop, val));
  if (save) localStorage.setItem(STORAGE_KEY, sizeKey);
}

/**
 * Restores the saved font size and wires up the `#fontSizeSelect` dropdown.
 * Safe to call on pages where the select doesn't exist – it exits silently.
 */
export function initFontSizeSelect() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? "default";
  applyFontSize(saved, false);

  const select = document.getElementById("fontSizeSelect");
  if (!select) return;

  select.value = saved;
  select.addEventListener("change", () => applyFontSize(select.value));
}
