/**
 * @module modules/preferences
 * @description Dashboard widget visibility preferences modal.
 * Any element with `[data-pref]` becomes toggleable.
 *
 * Usage:
 *   import { initPreferences } from './modules/preferences.js';
 *   initPreferences();
 */

const STORAGE_KEY = "prefs";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initPreferences() {
  const prefModal = document.getElementById("preferenceModal");
  const prefList  = document.getElementById("prefList");
  const closeBtn  = document.getElementById("closePrefBtn");
  const openBtn   = document.getElementById("openPrefBtn");

  if (!prefModal || !prefList || !closeBtn || !openBtn) return;

  let savedPrefs = loadPrefs();

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getPrefItems = () => document.querySelectorAll("[data-pref]");

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function applyPreferences() {
    getPrefItems().forEach((item) => {
      const key = item.dataset.prefKey ?? item.dataset.pref;
      item.style.display = savedPrefs[key] === false ? "none" : "";
    });
  }

  function generatePreferences() {
    prefList.innerHTML = "";

    getPrefItems().forEach((item, i) => {
      const key   = item.dataset.pref;
      const label = item.dataset.prefLabel || `Item ${i + 1}`;
      item.dataset.prefKey = key;

      const cbId  = `prefCheckbox-${i}`;
      const isOn  = savedPrefs[key] !== false;

      const row = document.createElement("div");
      row.className = "pref";
      row.innerHTML = `
        <div class="toggle-switch">
          <span>${label}</span>
          <input type="checkbox" id="${cbId}" data-key="${key}" ${isOn ? "checked" : ""}>
          <label for="${cbId}" class="toggle-label"></label>
        </div>
      `;
      prefList.appendChild(row);
    });

    applyPreferences();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  prefList.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    savedPrefs[e.target.dataset.key] = e.target.checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrefs));
    applyPreferences();
  });

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  function open()  { generatePreferences(); prefModal.style.display = "flex"; }
  function close() { prefModal.style.display = "none"; }

  // Expose globally for programmatic access if needed
  window.openPreferences = open;

  // Apply on load
  applyPreferences();
  generatePreferences();
}
