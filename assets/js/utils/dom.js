/**
 * @module utils/dom
 * @description Shared DOM utility helpers used across modules.
 */

/**
 * Loads HTML content asynchronously into a DOM element by ID.
 * @param {string} id - Target element ID.
 * @param {string} file - Path to the HTML file.
 * @param {...Function} callbacks - Functions to invoke after load.
 * @returns {void}
 */
export function includeHTML(id, file, ...callbacks) {
  const target = document.getElementById(id);
  if (!target) return;

  fetch(file)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${file}: ${res.statusText}`);
      return res.text();
    })
    .then((html) => {
      target.innerHTML = html;
      callbacks.forEach((cb) => typeof cb === "function" && cb());
    })
    .catch(() => {
      target.innerHTML = `<p style="color:red;">Error loading ${file}</p>`;
    });
}

/**
 * Extracts initials from a full name string.
 * @param {string} fullName
 * @returns {string} Up to two uppercase initials.
 */
export function getInitials(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Shows a toast notification element for a given duration.
 * @param {HTMLElement} toastEl - The toast DOM element.
 * @param {string} message - Message to display.
 * @param {number} [duration=3000] - Visible duration in ms.
 */
export function showToast(toastEl, message, duration = 3000) {
  if (!toastEl) return;
  toastEl.innerText = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), duration);
}
