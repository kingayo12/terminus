/**
 * @file main.js
 * @description Application entry point. Replaces the monolithic load.js.
 */

import { includeHTML } from "./utils/dom.js";
import { initTheme, initThemeManager } from "./modules/theme.js";
import { applyFontSize, initFontSizeSelect } from "./modules/fontSize.js";
import { initSidebarMenu } from "./modules/sidebar.js";
import { initUserInitials, initsettings, updateProfileCompletion } from "./modules/userProfile.js";
import { initDataTables } from "./modules/dataTables.js";
import { initPreferences } from "./modules/preferences.js";
import { initDashboardCards, initBreakdownModal } from "./modules/dashboard.js";
import { init2FA, initLockSetting, initAppLock } from "./modules/security.js";
import { initChangePassword } from "./modules/changePassword.js";
import { init_yardManagement } from "./modules/yardManagement.js";
import { initUI } from "./modules/ui.js";
import { initSettings } from "./modules/settings.js";

// ---------------------------------------------------------------------------
// Shared page callbacks
// Runs after every page load. Each function guards against missing elements
// so it exits silently on pages where it has nothing to do.
// ---------------------------------------------------------------------------

const PAGE_CALLBACKS = [
  initUI, // settings tabs, profile image, all popup handlers
  initSettings,
  initsettings,
  updateProfileCompletion,
  initFontSizeSelect,
  initDataTables,
  init2FA,
  initLockSetting,
  initAppLock,
  initTheme,
  initPreferences,
  initDashboardCards,
  initBreakdownModal,
  initChangePassword,
  init_yardManagement,
];

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

function initialLoad() {
  // Restore font size before any HTML is painted
  applyFontSize(localStorage.getItem("selectedFontSize") ?? "default", false);

  includeHTML("sidebar", "./components/sidebar.html", () => initSidebarMenu(PAGE_CALLBACKS));

  includeHTML(
    "header",
    "./components/header.html",
    initUserInitials,
    initThemeManager,
    initUI, // wires closeThemeBtn and any other header handlers
  );

  includeHTML("content", "../pages/dashboard.html", ...PAGE_CALLBACKS);
}

document.addEventListener("DOMContentLoaded", initialLoad);
