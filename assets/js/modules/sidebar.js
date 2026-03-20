/**
 * @module modules/sidebar
 * @description Handles sidebar navigation: dropdowns, active states,
 * and dynamic page loading via includeHTML.
 *
 * Usage:
 *   import { initSidebarMenu } from './modules/sidebar.js';
 *   initSidebarMenu(pageCallbacks);
 *
 * @param {Function[]} pageCallbacks - Array of init functions to run after
 *   each page load (e.g. initDataTables, initTheme, etc.)
 */

import { includeHTML } from "../utils/dom.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @param {Function[]} callbacks - Callbacks executed after every page load.
 */
export function initSidebarMenu(callbacks = []) {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const dropdowns = sidebar.querySelectorAll(".side_dropdown");
  const menuItems = sidebar.querySelectorAll(".menu_item");
  const submenuItems = sidebar.querySelectorAll(".side_dropdown_list a");

  // ── Helpers ──────────────────────────────────────────────────────────────

  function closeAllDropdowns(except = null) {
    dropdowns.forEach((d) => {
      if (d === except) return;
      d.style.maxHeight = null;
      d.style.overflow = "hidden";
      d.previousElementSibling?.classList.remove("open");
    });
  }

  function clearActiveStates() {
    menuItems.forEach((el) => el.classList.remove("active"));
    submenuItems.forEach((el) => el.classList.remove("active"));
  }

  function loadPage(target) {
    if (!target) return;
    includeHTML("content", `../pages/${target}.html`, ...callbacks);
  }

  function toggleDropdown(toggle, dropdown) {
    const isOpen = !!dropdown.style.maxHeight;
    closeAllDropdowns(isOpen ? null : dropdown);

    if (isOpen) {
      dropdown.style.maxHeight = null;
      dropdown.style.overflow = "hidden";
      toggle.classList.remove("open");
    } else {
      dropdown.style.maxHeight = `${dropdown.scrollHeight}px`;
      dropdown.style.overflow = "visible";
      toggle.classList.add("open");
    }
  }

  // ── Event delegation ─────────────────────────────────────────────────────

  sidebar.addEventListener("click", (e) => {
    const submenu = e.target.closest(".side_dropdown_list a");
    const menuItem = e.target.closest(".menu_item");

    // Submenu click
    if (submenu) {
      e.preventDefault();
      clearActiveStates();
      submenu.classList.add("active");

      const dropdown = submenu.closest(".side_dropdown");
      const parentMenu = dropdown?.previousElementSibling;
      parentMenu?.classList.add("active", "open");
      dropdown.style.maxHeight = `${dropdown.scrollHeight}px`;
      dropdown.style.overflow = "visible";

      loadPage(submenu.dataset.target);
      return;
    }

    // Top-level menu item click
    if (!menuItem) return;
    e.preventDefault();
    clearActiveStates();
    menuItem.classList.add("active");

    const dropdown = menuItem.nextElementSibling;
    const hasDropdown =
      menuItem.classList.contains("hasdropdown") &&
      dropdown?.classList.contains("side_dropdown");

    if (hasDropdown) {
      toggleDropdown(menuItem, dropdown);
      return;
    }

    closeAllDropdowns();
    loadPage(menuItem.dataset.target);
  });
}
