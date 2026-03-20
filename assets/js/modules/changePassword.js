/**
 * @module modules/changePassword
 * @description Change-password modal with real-time rule validation.
 *
 * Usage:
 *   import { initChangePassword } from './modules/changePassword.js';
 *   initChangePassword();
 */

// ---------------------------------------------------------------------------
// Rule definitions — extend here to add more password rules
// ---------------------------------------------------------------------------

/** @type {{ id: string; test: (pwd: string) => boolean }[]} */
const PASSWORD_RULES = [
  { id: "rule-length", test: (p) => p.length >= 8 },
  { id: "rule-upper",  test: (p) => /[A-Z]/.test(p) },
  { id: "rule-lower",  test: (p) => /[a-z]/.test(p) },
  { id: "rule-number", test: (p) => /[0-9]/.test(p) },
  { id: "rule-symbol", test: (p) => /[!@#$%^&*]/.test(p) },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initChangePassword() {
  const modal   = document.getElementById("changePasswordModal");
  const openBtn = document.getElementById("changepassword");
  const form    = document.getElementById("changePasswordForm");

  if (!modal || !openBtn || !form) return;

  const closeBtn = modal.querySelector(".close-button");

  // ── Open / close ──────────────────────────────────────────────────────────

  function open()  { modal.style.display = "flex"; }
  function close() { modal.style.display = "none"; }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  window.addEventListener("click", (e) => { if (e.target === modal) close(); });

  // ── Toggle password visibility ────────────────────────────────────────────

  modal.querySelectorAll(".toggle-eye").forEach((icon) => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      icon.classList.toggle("fa-eye-slash");
    });
  });

  // ── Live validation ───────────────────────────────────────────────────────

  const newPwdInput  = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const confirmMsg   = document.getElementById("confirmMsg");

  function validateRules() {
    const pwd = newPwdInput?.value ?? "";
    PASSWORD_RULES.forEach(({ id, test }) => setRuleState(id, test(pwd)));
    syncConfirmMessage();
  }

  function syncConfirmMessage() {
    if (!confirmMsg || !confirmInput) return;
    const match = newPwdInput?.value === confirmInput.value;
    confirmMsg.innerText = confirmInput.value && !match ? "Passwords do not match" : "";
  }

  newPwdInput?.addEventListener("input",  validateRules);
  confirmInput?.addEventListener("input", syncConfirmMessage);

  // ── Submit ────────────────────────────────────────────────────────────────

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const allValid = PASSWORD_RULES.every(({ id }) =>
      document.getElementById(id)?.classList.contains("valid")
    );

    if (!allValid) {
      alert("Password does not meet all requirements!");
      return;
    }

    if (newPwdInput?.value !== confirmInput?.value) {
      alert("Passwords do not match!");
      return;
    }

    alert("Password changed successfully!");
    close();
    form.reset();
    PASSWORD_RULES.forEach(({ id }) => {
      document.getElementById(id)?.classList.remove("valid");
    });
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function setRuleState(id, valid) {
  const rule = document.getElementById(id);
  if (!rule) return;

  const icon = rule.querySelector(".icon");
  rule.classList.toggle("valid", valid);

  if (icon) {
    icon.classList.toggle("fa-circle-check", valid);
    icon.classList.toggle("fa-circle-xmark", !valid);
  }
}
