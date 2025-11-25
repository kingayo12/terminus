/**
 * * --- Utility Functions ---
 * */

/**
 * Loads HTML content asynchronously into a specific DOM element.
 * @param {string} id - The ID of the element to inject content into.
 * @param {string} file - The path to the HTML file to load.
 * @param {...function} callbacks - Functions to call after successful loading.
 */
function includeHTML(id, file, ...callbacks) {
  const targetElement = document.getElementById(id);
  if (!targetElement) {
    console.error(`includeHTML: Target element with ID "${id}" not found.`);
    return;
  }

  fetch(file)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${file}: ${res.statusText}`);
      return res.text();
    })
    .then((data) => {
      // Security Note: Using innerHTML is fine for trusted, local files.
      // If the fetched files contained user-generated content, you would
      // need stricter sanitation to prevent XSS.
      targetElement.innerHTML = data;

      // Execute all provided callback functions
      callbacks.forEach((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    })
    .catch((error) => {
      console.error(`Error loading component ${file}:`, error);
      targetElement.innerHTML = `<p style="color:red;">Error loading ${file}</p>`;
    });
}

/**
 * * --- Initialization Logic ---
 * */

/**
 * Loads all main component files into the page structure.
 */
function initialLoad() {
  // Load components and run their specific initialization functions afterward
  includeHTML("sidebar", "./components/sidebar.html", initSidebarMenu);
  includeHTML("header", "./components/header.html", initUserInitials);

  // The 'content' area is loaded last, and its callback includes initDataTables
  includeHTML(
    "content",
    "../pages/dashboard.html",
    initDataTables,
    initTheme,
    initDarkModeToggle,
    initPreferences,
  );

  // Cards component is loaded without a dedicated callback
  includeHTML("cards", "../cards.html", updateProfileCompletion);
}

// Ensure all HTML elements are loaded before attempting to fetch components
document.addEventListener("DOMContentLoaded", initialLoad);

/**
 * Initializes the click handlers for sidebar menu items.
 * This is the function most likely causing your TypeError.
 */
function initSidebarMenu() {
  // **CRITICAL FIX**: Check if the elements exist.
  const menuItems = document.querySelectorAll(".sidebar .menu_item");

  if (menuItems.length === 0) {
    console.warn(
      "initSidebarMenu: No elements found matching '.sidebar .menu_item'. Check sidebar.html content.",
    );
    return; // Exit if no items are found, preventing the TypeError
  }

  menuItems.forEach((item) => {
    // The TypeError occurs if 'item' is null, but querySelectorAll returns a NodeList,
    // so this is safe as long as the elements are in the DOM when this runs.
    item.addEventListener("click", (e) => {
      e.preventDefault();

      menuItems.forEach((el) => el.classList.remove("active"));
      item.classList.add("active");

      const target = item.getAttribute("data-target");
      if (!target) return;

      const pageFile = `../pages/${target}.html`;

      // Define an array of callbacks for page loads
      const contentCallbacks = [
        initsettings, // Assumes initsettings is needed on page load
        updateProfileCompletion, // Assumes profile completion needs to update
        initDataTables, // Assumes DataTables needs to re-initialize on new content
        init2FA, // Assumes 2FA logic needs to be set up on new page
        initLockSetting, // Assumes Lock Setting logic needs to be set up on new page
        initAppLock, // Assumes App Lock logic needs to be set up on new page
        initTheme, // Re-apply theme settings
        initPreferences, // Re-initialize dashboard preferences

        // Dynamically call initialization function for the new page (e.g., init_settings)
        () => {
          const initFunctionName = `init_${target}`;
          if (typeof window[initFunctionName] === "function") {
            window[initFunctionName]();
          }
        },
      ];

      // Re-load the content area with the new page and run all collected callbacks
      includeHTML("content", pageFile, ...contentCallbacks);
    });
  });
}

// ... (Rest of your functions follow, maintaining original logic)

/**
 * Initializes user initials display logic.
 */
function initUserInitials() {
  const userWrapper = document.querySelector(".user_wrapper");
  if (!userWrapper) {
    console.warn("initUserInitials: User wrapper not found.");
    return;
  }

  const userNameElement = userWrapper.querySelector(".user_name");
  const initialsElement = userWrapper.querySelector(".user_initials");
  const userImage = userWrapper.querySelector(".user_img img");

  // Check if all necessary elements exist before proceeding
  if (!userNameElement || !initialsElement || !userImage) {
    console.warn("initUserInitials: One or more user display elements are missing.");
    return;
  }

  const fullName = userNameElement.textContent.trim();
  const initials = getInitials(fullName); // Assumes getInitials() is defined elsewhere

  if (userImage.src.endsWith("user.png")) {
    initialsElement.textContent = initials;
    userImage.style.display = "none";
    initialsElement.style.display = "flex";
  } else {
    initialsElement.style.display = "none";
    userImage.style.display = "block";
  }
}

/**
 * Initializes DataTables for all tables with the data-datatable attribute.
 */
function initDataTables() {
  // Ensure jQuery and DataTables are loaded before executing
  if (typeof $ === "undefined" || typeof $.fn.DataTable === "undefined") {
    console.error("initDataTables requires jQuery and DataTables libraries to be loaded.");
    return;
  }

  const $tablesToInit = $('table[data-datatable="true"]');

  if ($tablesToInit.length === 0) {
    console.log("initDataTables: No tables found with data-datatable='true'.");
    return;
  }

  $tablesToInit.each(function () {
    if ($.fn.dataTable.isDataTable(this)) return;

    const table = $(this).DataTable({
      dom: "Bfrtip",
      buttons: [
        { extend: "copy", className: "btn btn-dark" },
        { extend: "csv", className: "btn btn-primary" },
        { extend: "excel", className: "btn btn-success" },
        { extend: "pdf", className: "btn btn-danger" },
        { extend: "print", className: "btn btn-info" },
        { extend: "colvis", className: "btn btn-secondary" },
      ],
      pageLength: 5,
      responsive: true,
    });

    // Delegate click handlers to the table body (recommended)
    $(this).on("click", ".action-btn.edit", function () {
      const row = $(this).closest("tr");
      const data = table.row(row).data();
      alert(`Editing Record: ${data[0]}`);
    });

    $(this).on("click", ".action-btn.delete", function () {
      const row = $(this).closest("tr");
      const data = table.row(row).data();
      if (confirm(`Delete Record: ${data[0]}?`)) {
        table.row(row).remove().draw();
      }
    });
  });
}

/**
 * Initializes settings page interaction (edit, save, cancel).
 */
function initsettings() {
  const editBtn = document.getElementById("editBtn");
  const cancelBtn = document.querySelector(".cancelBtn");
  const saveBtn = document.querySelector(".saveBtn");
  const saveText = document.querySelector(".btnText");
  const loader = document.querySelector(".loader");
  const toast = document.getElementById("toast");
  const fields = document.querySelectorAll("[data-field]");

  // Check for critical elements before adding listeners (addresses potential TypeErrors)
  if (!editBtn || !cancelBtn || !saveBtn || !saveText || !loader || !toast) {
    console.warn("initsettings: One or more required control buttons/elements not found.");
    return;
  }

  editBtn.addEventListener("click", () => toggleEditing(true));
  cancelBtn.addEventListener("click", () => toggleEditing(false));

  saveBtn.addEventListener("click", () => {
    saveText.style.display = "none";
    loader.style.display = "inline-block";

    setTimeout(() => {
      // Update all fields dynamically
      fields.forEach((field) => {
        const name = field.dataset.field;
        const input = document.getElementById(name);
        // Safely construct display ID by capitalizing the first letter
        const displayID = "display" + name.charAt(0).toUpperCase() + name.slice(1);
        const display = document.getElementById(displayID);

        if (display && input) {
          display.innerText = input.value;
        } else {
          console.warn(
            `Settings update skipped for field: ${name}. Display or input element not found.`,
          );
        }
      });

      loader.style.display = "none";
      saveText.style.display = "inline-block";

      toggleEditing(false);
      showToast("Profile updated successfully!");
    }, 2000);
  });

  function toggleEditing(isEditing) {
    editBtn.style.display = isEditing ? "none" : "inline-block";
    cancelBtn.style.display = isEditing ? "inline-block" : "none";
    saveBtn.style.display = isEditing ? "inline-block" : "none";

    document
      .querySelectorAll(".display_text")
      .forEach((el) => (el.style.display = isEditing ? "none" : "block"));

    document
      .querySelectorAll(".edit_input")
      .forEach((el) => (el.style.display = isEditing ? "block" : "none"));
  }

  // Toast function
  function showToast(message) {
    if (!toast) return; // Prevent error if toast is missing
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000); // visible for 3s
  }
}

const profileItems = [
  { name: "Setup account", percent: 10, completed: true },
  { name: "Upload your photo", percent: 5, completed: true },
  { name: "Personal Info", percent: 10, completed: true },
  { name: "Location", percent: 20, completed: false },
  { name: "Biography", percent: 15, completed: true },
  { name: "Notifications", percent: 10, completed: false },
  { name: "Bank details", percent: 30, completed: false },
];

/**
 * Updates the profile completion status display.
 */
function updateProfileCompletion() {
  const completionPercent = document.getElementById("completionPercent");
  const completionItems = document.getElementById("completionItems");
  const progressCircle = document.querySelector(".circular_progress .progress");

  if (!completionPercent || !completionItems || !progressCircle) {
    console.warn(
      "updateProfileCompletion: One or more required elements for completion display not found.",
    );
    return;
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // 1. Calculate the total percentage
  let totalPercent = profileItems
    .filter((item) => item.completed)
    .reduce((acc, item) => acc + item.percent, 0);

  // --- START: COLOR LOGIC IMPLEMENTATION ---
  let progressColor;

  if (totalPercent < 50) {
    progressColor = "orange"; // 0% to 49%
  } else if (totalPercent < 70) {
    progressColor = "#ffeb3b"; // Yellow (using a common material design shade for better visibility)
  } else {
    progressColor = "green"; // 70% to 100%
  }

  // Apply the determined color to the SVG stroke
  progressCircle.style.stroke = progressColor;
  // --- END: COLOR LOGIC IMPLEMENTATION ---

  // Update circular progress (Offset calculation remains the same)
  const offset = circumference - (totalPercent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;

  // Update text
  completionPercent.innerText = totalPercent + "%";

  // Update list
  completionItems.innerHTML = "";
  profileItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = item.completed ? "completed" : "incomplete";
    li.innerHTML = `<span>${item.name}</span><span>${
      item.completed ? item.percent + "%" : "+" + item.percent + "%"
    }</span>`;
    completionItems.appendChild(li);
  });
}

// ---------------------------------------2fa---------------------------

function init2FA() {
  const manageBtn = document.getElementById("manage2FABtn");
  const modal = document.getElementById("twoFAModal");
  const closeBtn = modal ? modal.querySelector(".close-button") : null;

  if (!modal) {
    console.warn("init2FA: 2FA modal (#twoFAModal) not found.");
    return;
  }

  // Modal trigger
  if (manageBtn) {
    manageBtn.addEventListener("click", () => toggle2FAModal(true));
  } else {
    console.warn("init2FA: #manage2FABtn not found.");
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener("click", () => toggle2FAModal(false));
  }

  // Click outside to close
  window.addEventListener("click", (event) => {
    if (event.target === modal) toggle2FAModal(false);
  });

  console.log("2FA initialized successfully.");

  setup2FAToggle();
}

function setup2FAToggle() {
  const toggle2FA = document.getElementById("toggle2FA");
  const manageBtn = document.getElementById("manage2FABtn");

  if (!toggle2FA) return;

  toggle2FA.addEventListener("change", () => {
    manageBtn.disabled = !toggle2FA.checked;

    if (!toggle2FA.checked) {
      toggle2FAModal(false);
    }
  });
}

function toggle2FAModal(show) {
  const modal = document.getElementById("twoFAModal");
  if (!modal) return;

  modal.style.display = show ? "flex" : "none";
}

function initLockSetting() {
  const toggleLock = document.getElementById("toggleLock");
  const openLockBtn = document.getElementById("openLockBtn");
  const modal = document.getElementById("lockTimeoutModal");
  const timeoutSelect = document.getElementById("timeoutSelect");
  const toast = document.getElementById("toast"); // toast support

  if (!toggleLock || !openLockBtn || !modal || !timeoutSelect || !toast) {
    console.warn("initLockSetting: Missing required elements.");
    return;
  }

  // Restore saved toggle state
  const savedEnabled = localStorage.getItem("lock_enabled") === "true";
  toggleLock.checked = savedEnabled;

  function updateButtonState() {
    openLockBtn.disabled = !toggleLock.checked;
    localStorage.setItem("lock_enabled", toggleLock.checked);
  }

  updateButtonState();

  toggleLock.addEventListener("change", updateButtonState);

  // =============== SHOW MODAL =================
  window.openLockModal = function () {
    if (!toggleLock.checked) {
      showToast("Enable Screen Lock first.");
      return;
    }
    modal.style.display = "flex";
  };

  // =============== HIDE MODAL =================
  window.closeLockModal = function () {
    modal.style.display = "none";
  };

  // =============== SAVE TIMEOUT ===============
  window.saveTimeoutSetting = function () {
    const value = timeoutSelect.value;
    localStorage.setItem("inactivity_timeout", value);

    closeLockModal();

    // Instead of alert → Show toast
    showToast(`Timeout set to ${value} minute${value > 1 ? "s" : ""}`);
  };

  // =============== BUTTON ENABLE/DISABLE ===============
  function updateButtonState() {
    openLockBtn.disabled = !toggleLock.checked;
  }

  updateButtonState();
  toggleLock.addEventListener("change", updateButtonState);
  openLockBtn.addEventListener("click", openLockModal);

  console.log("🔐 Screen Lock initialized");

  // =============== SAVE TIMEOUT =====
  window.saveTimeoutSetting = function () {
    const value = timeoutSelect.value;
    localStorage.setItem("inactivity_timeout", value);
    closeLockModal();
    showToast(`Timeout set to ${value} minute${value > 1 ? "s" : ""}`);
  };

  // =================== TOAST FUNCTION ===================
  function showToast(message) {
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

function initAppLock() {
  const lockScreen = document.getElementById("lockScreen");
  const unlockInput = document.getElementById("unlockInput");
  const unlockBtn = document.getElementById("unlockBtn");
  const unlockError = document.getElementById("unlockError");

  let inactivityTimer = null;

  // ===========================
  // LOCK APP
  // ===========================
  function lockApp() {
    const enabled = localStorage.getItem("lock_enabled") === "true";
    if (!enabled) return; // ❗ Do not lock if user disabled lock

    lockScreen.style.display = "flex";
    unlockInput.value = "";
    unlockError.innerText = "";
    unlockInput.focus();
  }

  function unlockApp() {
    lockScreen.style.display = "none";
  }

  // ===========================
  // VERIFY PASSWORD
  // ===========================
  async function verifyPassword(pwd) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(pwd === "admin123" || pwd === "token001");
      }, 900);
    });
  }

  unlockBtn.addEventListener("click", async () => {
    const pwd = unlockInput.value.trim();

    if (!pwd) {
      unlockError.innerText = "Please enter your password";
      return;
    }

    unlockBtn.classList.add("loading");
    unlockError.innerText = "";

    const ok = await verifyPassword(pwd);

    unlockBtn.classList.remove("loading");

    if (!ok) {
      unlockError.innerText = "Incorrect password";
      return;
    }

    unlockApp();
    resetInactivityTimer();
  });

  // ===========================
  // INACTIVITY TIMER
  // ===========================
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    const enabled = localStorage.getItem("lock_enabled") === "true";
    if (!enabled) return; // ❗ No timer if lock disabled

    const minutes = Number(localStorage.getItem("inactivity_timeout") || 5);

    inactivityTimer = setTimeout(lockApp, minutes * 60 * 1000);
  }

  ["mousemove", "keydown", "click", "scroll"].forEach((evt) => {
    document.addEventListener(evt, resetInactivityTimer);
  });

  resetInactivityTimer();

  // ===========================
  // CONDITIONAL ANTI-INSPECT
  // ===========================
  function enableAntiInspect() {
    // Disable Right-Click
    document.addEventListener("contextmenu", blockContextMenu);
    // Disable DevTools shortcuts
    window.addEventListener("keydown", blockDevTools);
  }

  function disableAntiInspect() {
    document.removeEventListener("contextmenu", blockContextMenu);
    window.removeEventListener("keydown", blockDevTools);
  }

  function blockContextMenu(e) {
    e.preventDefault();
  }

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

  // When lock screen shows → enable block
  function lockApp() {
    const enabled = localStorage.getItem("lock_enabled") === "true";
    if (!enabled) return;

    lockScreen.style.display = "flex";
    unlockInput.value = "";
    unlockError.innerText = "";
    unlockInput.focus();

    enableAntiInspect(); // 🚫 Block inspect ONLY here
  }

  // When unlocked → allow inspect normally
  function unlockApp() {
    lockScreen.style.display = "none";
    disableAntiInspect(); // ✅ Re-enable inspect
  }

  console.log("🔐 App Lock Active");
}

// Function to apply theme with optional animation
function applyTheme(theme, animate = true) {
  // 1. Sanitize theme for className (e.g., "Theme One" -> "theme-one")
  const safeTheme = theme.trim().toLowerCase().replace(/\s+/g, "-");

  if (animate) {
    // Use a class for the transition instead of inline styles for cleaner code
    document.body.classList.add("theme-transition");
    document.body.style.opacity = 0;

    setTimeout(() => {
      replaceThemeClass(safeTheme);
      document.body.style.opacity = 1; // Optional: Remove transition class after animation to save performance

      setTimeout(() => {
        document.body.classList.remove("theme-transition");
      }, 300);
    }, 300);
  } else {
    replaceThemeClass(safeTheme);
  }
}

// Optimized function to replace existing theme class
function replaceThemeClass(newTheme) {
  const body = document.body; // Get all current classes as an array

  const classes = Array.from(body.classList); // A simple way to identify existing themes: they are not 'dark-mode' // Assuming your theme classes are simple like 'theme-one', 'theme-two', etc.

  const themeClasses = classes.filter((cls) => cls !== "dark-mode"); // Remove all identified theme classes

  themeClasses.forEach((cls) => body.classList.remove(cls)); // Add the new theme class

  body.classList.add(newTheme); // Ensure dark mode status is reapplied from localStorage after class replacement

  const savedDark = localStorage.getItem("darkMode") === "true";
  if (savedDark) {
    body.classList.add("dark-mode");
  } else {
    body.classList.remove("dark-mode"); // Crucial if a theme change happens while dark mode is off
  }
}

/**
 * 🎨 Initializes the primary application theme (e.g., 'blue', 'red', 'green').
 * Relies on applyTheme() being available globally or defined nearby.
 */
function initTheme() {
  const themeBoxes = document.querySelectorAll(".boxTheme1");
  const body = document.body; // Load and apply saved theme

  const savedTheme = localStorage.getItem("selectedTheme"); // Apply initial theme state without animation (if saved) // NOTE: The dark mode class must be applied *after* the theme class // to ensure dark-mode CSS overrides are correctly processed.

  if (savedTheme) {
    // Assumes applyTheme handles setting the theme class
    applyTheme(savedTheme, false);
  } // Click handler for theme boxes

  themeBoxes.forEach((box) => {
    box.addEventListener("click", () => {
      const theme = box.getAttribute("data-content");
      localStorage.setItem("selectedTheme", theme); // Apply theme with animation
      applyTheme(theme, true);
    });
  });
}

// -------------------------------------------------------------

/**
 * 🌙 Initializes Dark Mode functionality (toggling and persistent state).
 */
function initDarkModeToggle() {
  const darkToggle = document.querySelector(".toggle_theme");
  const body = document.body;

  if (!darkToggle) {
    console.warn("initDarkModeToggle: Element with class '.toggle_theme' not found.");
    return;
  } // Load saved dark mode state

  const savedDark = localStorage.getItem("darkMode") === "true"; // Apply initial dark mode state

  if (savedDark) {
    body.classList.add("dark-mode");
    darkToggle.setAttribute("aria-checked", "true");
    darkToggle.classList.add("dark"); // Sync the custom toggle's visual state
  } // DARK MODE BUTTON LISTENER

  darkToggle.addEventListener("click", () => {
    // 1. Toggle the 'dark-mode' class on the body
    const isDark = body.classList.toggle("dark-mode"); // 2. Update localStorage

    localStorage.setItem("darkMode", isDark); // 3. Sync the button's visual and accessible state

    darkToggle.setAttribute("aria-checked", isDark);
    darkToggle.classList.toggle("dark", isDark);
  });
}

// ========================= UTILITY/HELPER FUNCTION (Assuming this is an external helper) =========================
function handleThemeSwitch() {
  // This function seems redundant now that initDarkModeToggle handles everything.
  // It's only toggling the button's class, not the body theme.
  // You should integrate its logic into initDarkModeToggle or remove it.
  // Retaining for reference, but it's likely safe to delete if not used elsewhere.
  document.querySelector(".toggle_theme").classList.toggle("dark");
}

// Initialization should only run once
document.addEventListener("DOMContentLoaded", () => {
  initTheme(); // Load primary theme
  initDarkModeToggle(); // Load dark mode toggle
});

/**
 * Initializes the dashboard preferences modal logic.
 * This function is designed to be called directly after the content area is loaded.
 */
function initPreferences() {
  const prefModal = document.getElementById("preferenceModal");
  const prefList = document.getElementById("prefList");
  const closeBtn = document.getElementById("closePrefBtn");
  const openBtn = document.getElementById("openPrefBtn"); // Gear button to open modal

  if (!prefModal || !prefList || !closeBtn || !openBtn) return;

  // Load saved preferences from localStorage
  let savedPrefs = JSON.parse(localStorage.getItem("prefs")) || {};

  // Collect all items that can be toggled
  function getPrefItems() {
    return document.querySelectorAll("[data-pref]");
  }

  // Generate the list of toggleable preferences
  function generatePreferences() {
    prefList.innerHTML = ""; // Clear old list

    getPrefItems().forEach((item, index) => {
      const key = item.dataset.pref;
      const label = item.dataset.prefLabel || `Item ${index + 1}`;

      // Save key to the element
      item.dataset.prefKey = key;

      // Unique ID for checkbox
      const checkboxId = `prefCheckbox-${index}`;

      // Create a toggle row
      const row = document.createElement("div");
      row.className = "pref";
      row.innerHTML = `
        <div class="toggle-switch">
          <span>${label}</span>
          <input type="checkbox" id="${checkboxId}" data-key="${key}" ${
        savedPrefs[key] !== false ? "checked" : ""
      }>
          <label for="${checkboxId}" class="toggle-label"></label>
        </div>
      `;

      prefList.appendChild(row);
    });

    applyPreferences();
  }

  // Apply user preferences to elements
  function applyPreferences() {
    getPrefItems().forEach((item) => {
      const key = item.dataset.prefKey;
      item.style.display = savedPrefs[key] === false ? "none" : "";
    });
  }

  // Listen for changes in toggles
  prefList.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;

    const key = e.target.dataset.key;
    savedPrefs[key] = e.target.checked;
    localStorage.setItem("prefs", JSON.stringify(savedPrefs));

    applyPreferences();
  });

  // Open modal
  openBtn.addEventListener("click", () => {
    generatePreferences();
    prefModal.style.display = "flex";
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    prefModal.style.display = "none";
  });

  // Expose globally
  window.openPreferences = () => {
    generatePreferences();
    prefModal.style.display = "flex";
  };

  // Apply preferences on page load
  applyPreferences();

  generatePreferences();
}

// Initialize preferences when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initPreferences();
});
