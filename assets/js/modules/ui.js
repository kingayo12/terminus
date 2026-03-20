/**
 * @module modules/ui
 * @description Header/sidebar UI interactions: collapse, theme popup,
 * notification panels, settings tabs, profile image, and avatar selection.
 *
 * All functions that are referenced by inline HTML onclick="" attributes
 * are explicitly assigned to `window` at the bottom of this file.
 *
 * Usage (called from main.js after header/sidebar components are injected):
 *   import { initUI } from './modules/ui.js';
 *   initUI();
 */

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function handleCollapseToggle() {
  document.getElementById("sidebar")?.classList.toggle("collapsed_menu");
}

function handlemobileToggle() {
  document.getElementById("sidebar")?.classList.toggle("showd");
}

// ---------------------------------------------------------------------------
// Theme popup
// ---------------------------------------------------------------------------

function handleThemeShow() {
  document.querySelector(".theme_wrapper")?.classList.add("show");
  document.querySelector(".boxTheme")?.classList.add("animate__fadeInDown");
}

function closeThemePopup() {
  const wrap = document.querySelector(".theme_wrapper");
  const box = document.querySelector(".boxTheme");
  if (!wrap || !box) return;

  box.classList.remove("animate__fadeInDown");
  box.classList.add("animate__fadeOutUp");
  box.addEventListener(
    "animationend",
    () => {
      wrap.classList.remove("show");
      box.classList.remove("animate__fadeOutUp");
    },
    { once: true },
  );
}

// ---------------------------------------------------------------------------
// Notification & panel popups
// ---------------------------------------------------------------------------

function handleNotiPopup() {
  document.querySelector(".noti_box")?.classList.add("show");
  document.querySelector(".panel_box")?.classList.remove("show");
}

function closeNotiPopup() {
  animateOut(document.querySelector(".noti_box"));
}

function handlePanelPopup() {
  document.querySelector(".panel_box")?.classList.add("show");
  document.querySelector(".noti_box")?.classList.remove("show");
}

function closePanelPopup() {
  animateOut(document.querySelector(".panel_box"));
}

function handleUserDropdown() {
  document.querySelector(".user_box")?.classList.add("show");
  document.querySelector(".panel_box")?.classList.remove("show");
  document.querySelector(".noti_box")?.classList.remove("show");
}

function closeUserDropdown() {
  const box = document.querySelector(".user_box");
  if (!box?.classList.contains("show")) return;

  box.classList.add("animate__fadeOutRight");
  box.addEventListener(
    "animationend",
    () => {
      box.classList.remove("show", "animate__fadeOutRight");
      box.classList.add("animate__fadeInRight");
    },
    { once: true },
  );
}

/** Shared fade-out helper for popup boxes. */
function animateOut(box) {
  if (!box) return;
  box.classList.add("animate__fadeOutUp");
  box.addEventListener(
    "animationend",
    () => {
      box.classList.remove("show", "animate__fadeOutUp");
      box.classList.add("animate__fadeInDown");
    },
    { once: true },
  );
}

// ---------------------------------------------------------------------------
// Settings tabs
// ---------------------------------------------------------------------------

/**
 * Activates a settings nav link and its corresponding tab panel.
 * Called via inline onclick: handleSettingsMenu(this, 'profile')
 * @param {HTMLElement} element - The clicked nav link.
 * @param {string}      tabId   - ID of the tab panel to show.
 */
function handleSettingsMenu(element, tabId) {
  document
    .querySelectorAll(".settings_menu .navlink")
    .forEach((link) => link.classList.remove("active"));
  element.classList.add("active");

  document.querySelectorAll(".tabPage").forEach((tab) => tab.classList.remove("active"));
  document.getElementById(tabId)?.classList.add("active");
}

function toggleSettingsMenu() {
  document.querySelector(".settings_menu")?.classList.toggle("open");
}

// ---------------------------------------------------------------------------
// Profile image & avatars
// ---------------------------------------------------------------------------

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function initProfileImage() {
  const img = document.getElementById("profileImg");
  if (!img) return;

  const nameText =
    document.querySelector(".profile_cards .name")?.textContent.replace("Name:", "").trim() || "mo";

  if (!img.src || img.src.includes("user.png")) {
    img.src = "";
    img.alt = getInitials(nameText);
    Object.assign(img.style, {
      background: "#007bff",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      width: "150px",
      height: "150px",
      fontSize: "36px",
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: "100px",
    });
  } else {
    img.style.background = "none";
  }
}

function changeProfileImage() {
  const img = document.getElementById("profileImg");
  if (!img) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target.result;
      img.style.background = "none";
    };
    reader.readAsDataURL(file);
  });
}

function selectAvatar(imgElement) {
  const img = document.getElementById("profileImg");
  if (!img) return;
  img.src = imgElement.src;
  img.style.background = "none";
}

function cancelProfileChanges() {
  alert("Changes canceled");
  initProfileImage();
}

function saveProfileChanges() {
  alert("Profile saved");
}

// ---------------------------------------------------------------------------
// Init — called once after the header component is injected
// ---------------------------------------------------------------------------

export function initUI() {
  // Wire up the close-theme button (lives in the header component)
  const closeThemeBtn = document.querySelector(".closeThemeBtn");
  closeThemeBtn?.addEventListener("click", closeThemePopup);

  // Activate the first settings tab if the settings page is present
  const firstLink = document.querySelector(".settings_menu .navlink");
  const firstTab = document.querySelector(".tabPage");
  if (firstLink && firstTab) {
    firstLink.classList.add("active");
    firstTab.classList.add("active");
  }

  // Init profile image display
  initProfileImage();
}

// ---------------------------------------------------------------------------
// Expose to window — required for inline onclick="" attributes in HTML
// fragments that cannot import ES modules directly.
// ---------------------------------------------------------------------------
window.handleCollapseToggle = handleCollapseToggle;
window.handlemobileToggle = handlemobileToggle;
window.handleThemeShow = handleThemeShow;
window.closeThemePopup = closeThemePopup;
window.handleNotiPopup = handleNotiPopup;
window.closeNotiPopup = closeNotiPopup;
window.handlePanelPopup = handlePanelPopup;
window.closePanelPopup = closePanelPopup;
window.handleUserDropdown = handleUserDropdown;
window.closeUserDropdown = closeUserDropdown;
window.handleSettingsMenu = handleSettingsMenu;
window.toggleSettingsMenu = toggleSettingsMenu;
window.changeProfileImage = changeProfileImage;
window.selectAvatar = selectAvatar;
window.cancelProfileChanges = cancelProfileChanges;
window.saveProfileChanges = saveProfileChanges;
