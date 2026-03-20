/**
 * @module modules/security
 * @description Handles 2FA modal, inactivity screen-lock, and
 * conditional DevTools blocking.
 *
 * Usage:
 *   import { init2FA, initLockSetting, initAppLock }
 *     from './modules/security.js';
 */

import { showToast } from "../utils/dom.js";

// ---------------------------------------------------------------------------
// 2FA
// ---------------------------------------------------------------------------

/**
 * Initialises the 2FA management button and modal.
 * Requires `#manage2FABtn`, `#twoFAModal`, `#toggle2FA`.
 */
export function init2FA() {
  const modal     = document.getElementById("twoFAModal");
  const manageBtn = document.getElementById("manage2FABtn");
  const toggle2FA = document.getElementById("toggle2FA");

  if (!modal) return;

  const closeBtn = modal.querySelector(".close-button");

  manageBtn?.addEventListener("click", () => toggle2FAModal(true));
  closeBtn?.addEventListener("click",  () => toggle2FAModal(false));

  window.addEventListener("click", (e) => {
    if (e.target === modal) toggle2FAModal(false);
  });

  // Enable / disable the Manage button based on the toggle
  toggle2FA?.addEventListener("change", () => {
    if (manageBtn) manageBtn.disabled = !toggle2FA.checked;
    if (!toggle2FA.checked) toggle2FAModal(false);
  });
}

function toggle2FAModal(show) {
  const modal = document.getElementById("twoFAModal");
  if (modal) modal.style.display = show ? "flex" : "none";
}

// ---------------------------------------------------------------------------
// Screen lock settings
// ---------------------------------------------------------------------------

/**
 * Wires up the inactivity screen-lock settings UI.
 * Requires `#toggleLock`, `#openLockBtn`, `#lockTimeoutModal`,
 * `#timeoutSelect`, `#toast`.
 */
export function initLockSetting() {
  const toggleLock   = document.getElementById("toggleLock");
  const openLockBtn  = document.getElementById("openLockBtn");
  const modal        = document.getElementById("lockTimeoutModal");
  const timeoutSelect = document.getElementById("timeoutSelect");
  const toast        = document.getElementById("toast");

  if (!toggleLock || !openLockBtn || !modal || !timeoutSelect || !toast) return;

  // Restore saved state
  toggleLock.checked = localStorage.getItem("lock_enabled") === "true";

  function syncButton() {
    openLockBtn.disabled = !toggleLock.checked;
    localStorage.setItem("lock_enabled", String(toggleLock.checked));
  }

  syncButton();
  toggleLock.addEventListener("change", syncButton);
  openLockBtn.addEventListener("click", openLockModal);

  // Expose globally so inline onclick attributes can reach them
  window.openLockModal = openLockModal;
  window.closeLockModal = () => { modal.style.display = "none"; };
  window.saveTimeoutSetting = () => {
    const value = timeoutSelect.value;
    localStorage.setItem("inactivity_timeout", value);
    window.closeLockModal();
    showToast(toast, `Timeout set to ${value} minute${value > 1 ? "s" : ""}`);
  };

  function openLockModal() {
    if (!toggleLock.checked) {
      showToast(toast, "Enable Screen Lock first.");
      return;
    }
    modal.style.display = "flex";
  }
}

// ---------------------------------------------------------------------------
// App lock (inactivity + anti-inspect)
// ---------------------------------------------------------------------------

/**
 * Activates the inactivity lock screen and optional DevTools blocking.
 * Requires `#lockScreen`, `#unlockInput`, `#unlockBtn`, `#unlockError`.
 */
export function initAppLock() {
  const lockScreen  = document.getElementById("lockScreen");
  const unlockInput = document.getElementById("unlockInput");
  const unlockBtn   = document.getElementById("unlockBtn");
  const unlockError = document.getElementById("unlockError");

  if (!lockScreen || !unlockInput || !unlockBtn || !unlockError) return;

  let inactivityTimer = null;

  // ── Lock / unlock ────────────────────────────────────────────────────────

  function lockApp() {
    if (localStorage.getItem("lock_enabled") !== "true") return;
    lockScreen.style.display = "flex";
    unlockInput.value = "";
    unlockError.innerText = "";
    unlockInput.focus();
    enableAntiInspect();
  }

  function unlockApp() {
    lockScreen.style.display = "none";
    disableAntiInspect();
    resetInactivityTimer();
  }

  // ── Password verification (replace with real API call as needed) ──────────

  async function verifyPassword(pwd) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(pwd === "admin123" || pwd === "token001"), 900)
    );
  }

  unlockBtn.addEventListener("click", async () => {
    const pwd = unlockInput.value.trim();
    if (!pwd) { unlockError.innerText = "Please enter your password"; return; }

    unlockBtn.classList.add("loading");
    unlockError.innerText = "";

    const ok = await verifyPassword(pwd);
    unlockBtn.classList.remove("loading");

    if (!ok) { unlockError.innerText = "Incorrect password"; return; }
    unlockApp();
  });

  // ── Inactivity timer ─────────────────────────────────────────────────────

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (localStorage.getItem("lock_enabled") !== "true") return;
    const minutes = Number(localStorage.getItem("inactivity_timeout") || 5);
    inactivityTimer = setTimeout(lockApp, minutes * 60 * 1000);
  }

  ["mousemove", "keydown", "click", "scroll"].forEach((evt) =>
    document.addEventListener(evt, resetInactivityTimer)
  );

  resetInactivityTimer();

  // ── Anti-inspect (only active while locked) ───────────────────────────────

  function blockContextMenu(e) { e.preventDefault(); }

  function blockDevTools(e) {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function enableAntiInspect() {
    document.addEventListener("contextmenu", blockContextMenu);
    window.addEventListener("keydown", blockDevTools);
  }

  function disableAntiInspect() {
    document.removeEventListener("contextmenu", blockContextMenu);
    window.removeEventListener("keydown", blockDevTools);
  }
}
