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
    initDashboardCards,
    initBreakdownModal,
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

  const toggles = document.querySelectorAll(".menu_item.hasdropdown");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();

      const dropdown = toggle.nextElementSibling;

      // Only work if the next sibling is a .side_dropdown
      if (!dropdown || !dropdown.classList.contains("side_dropdown")) return;

      // Close all other dropdowns
      document.querySelectorAll(".side_dropdown").forEach((d) => {
        if (d !== dropdown) {
          d.style.maxHeight = null;
          d.style.overflow = "hidden";
          d.previousElementSibling.classList.remove("open");
        }
      });

      // Toggle current dropdown
      if (dropdown.style.maxHeight) {
        // Close it
        dropdown.style.maxHeight = null;
        toggle.classList.remove("open");
        dropdown.style.overflow = "hidden";
      } else {
        // Open it
        dropdown.style.maxHeight = dropdown.scrollHeight + "px";
        dropdown.style.overflow = "visible";
        toggle.classList.add("open");
      }
    });
  });

  menuItems.forEach((item) => {
    // The TypeError occurs if 'item' is null, but querySelectorAll returns a NodeList,
    // so this is safe as long as the elements are in the DOM when this runs.
    item.addEventListener("click", (e) => {
      e.preventDefault();

      const hasDropdown = item.classList.contains("hasdropdown");

      // Remove active from ALL menu items
      menuItems.forEach((el) => el.classList.remove("active"));

      // Remove active from ALL submenu items
      document
        .querySelectorAll(".side_dropdown_list a")
        .forEach((a) => a.classList.remove("active"));

      // If it is NOT a dropdown parent => close all dropdowns
      if (!hasDropdown) {
        document.querySelectorAll(".side_dropdown").forEach((d) => {
          d.style.maxHeight = null;
          d.style.overflow = "hidden";
          d.previousElementSibling.classList.remove("open");
        });
      }

      // Activate clicked menu item
      item.classList.add("active");

      const target = item.getAttribute("data-target");
      if (!target) return;

      const pageFile = `../pages/${target}.html`;

      // Define an array of callbacks for page loads
      const contentCallbacks = [
        initFontSizeSelect,
        initsettings, // Assumes initsettings is needed on page load
        updateProfileCompletion, // Assumes profile completion needs to update
        initDataTables, // Assumes DataTables needs to re-initialize on new content
        init2FA, // Assumes 2FA logic needs to be set up on new page
        initLockSetting, // Assumes Lock Setting logic needs to be set up on new page
        initAppLock, // Assumes App Lock logic needs to be set up on new page
        initTheme, // Re-apply theme settings
        initThemeSelectAndToggle,
        initPreferences, // Re-initialize dashboard preferences
        initDashboardCards,
        initBreakdownModal,
        initChangePassword,

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

  const submenuItems = document.querySelectorAll(".side_dropdown_list a");

  submenuItems.forEach((sub) => {
    sub.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove all submenu active states
      submenuItems.forEach((a) => a.classList.remove("active"));

      // Activate clicked submenu
      sub.classList.add("active");

      // Parent dropdown item
      const parentDropdown = sub.closest(".side_dropdown");
      const parentMenu = parentDropdown.previousElementSibling;

      // Remove active from all main items first
      menuItems.forEach((m) => m.classList.remove("active"));

      // Activate parent menu
      parentMenu.classList.add("active");

      // Ensure dropdown is OPEN
      parentDropdown.style.maxHeight = parentDropdown.scrollHeight + "px";
      parentDropdown.style.overflow = "visible";
      parentMenu.classList.add("open");

      // Load page
      const target = sub.getAttribute("data-target");
      if (!target) return;

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
        initDashboardCards,
        initThemeSelectAndToggle,
        initBreakdownModal,
        // initFontSizeSelect, // Not needed here since it's an issue
        initChangePassword,

        // Dynamically call initialization function for the new page (e.g., init_settings)
        () => {
          const initFunctionName = `init_${target}`;
          if (typeof window[initFunctionName] === "function") {
            window[initFunctionName]();
          }
        },
      ];

      const pageFile = `../pages/${target}.html`;

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
// A mapping of action names to their HTML structure (button, icon, and class)
const ACTION_TEMPLATES = {
  edit: `
        <button class="action-btn edit" title="Edit"><i class="fa fa-edit"></i></button>
    `,
  delete: `
        <button class="action-btn delete" title="Delete"><i class="fa fa-trash"></i></button>
    `,
  preview: `
        <button class="action-btn preview" title="Preview"><i class="fa fa-eye"></i></button>
    `,
  // Add any other actions here (e.g., 'suspend', 'approve', 'view_details')
  details: `
        <button class="action-btn details" title="Details"><i class="fa fa-info-circle"></i></button>
    `,
};

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
    const $table = $(this);
    if ($.fn.dataTable.isDataTable(this)) return;

    // 1. Get the list of actions defined for this specific table
    const actionList = $table.data("actions"); // Reads the data-actions attribute
    const desiredActions = actionList ? actionList.split(",").map((a) => a.trim()) : [];

    // 2. Build the HTML string for the actions container
    let actionsHtml = "";
    desiredActions.forEach((actionName) => {
      if (ACTION_TEMPLATES[actionName]) {
        actionsHtml += ACTION_TEMPLATES[actionName];
      }
    });

    // 3. Wrap the actions in the hover container
    const fullActionsContainer = `<div class="row-actions">${actionsHtml}</div>`;

    const table = $table.DataTable({
      stateSave: true,
      lengthMenu: [10, 25, 50, -1],
      dom: "Bfrtip",
      buttons: [
        // ... (Your existing buttons configuration) ...
        {
          extend: "collection",
          className: "btn btn-primary",
          text: '<i class="fa fa-download"></i> Export',
          autoClose: true,
          buttons: [
            { extend: "copy", text: "Copy" },
            { extend: "csv", text: "Export CSV" },
            { extend: "excel", text: "Export Excel" },
            { extend: "pdf", text: "Export PDF" },
          ],
        },
        { extend: "print", className: "btn btn-info", text: "Print" },
        { extend: "colvis", className: "btn btn-secondary", text: "Columns" },
      ],
      pageLength: 5,
      responsive: true,
      // processing: true,
      // serverSide: true,

      // Inject the dynamic action buttons into the last column of the row
      createdRow: function (row, data, dataIndex) {
        if (fullActionsContainer) {
          $(row).find("td:last").append(fullActionsContainer);
        }
      },
    });

    // Delegate click handlers for ALL possible action classes
    $table.on("click", ".action-btn.edit", function () {
      const row = $(this).closest("tr");
      const data = table.row(row).data();
      alert(`Editing Record: S/N ${data[0]}`);
    });

    $table.on("click", ".action-btn.delete", function () {
      const row = $(this).closest("tr");
      const data = table.row(row).data();
      if (confirm(`Delete Record: S/N ${data[0]}?`)) {
        table.row(row).remove().draw();
      }
    });

    $table.on("click", ".action-btn.preview", function () {
      const row = $(this).closest("tr");
      const data = table.row(row).data();
      alert(`Previewing Record: ${data[1]} (Code: ${data[2]})`);
    });

    // Add handlers for any new dynamic actions (e.g., 'details')
    $table.on("click", ".action-btn.details", function () {
      const row = $(this).closest("tr");
      const data = table.row(row).data();
      console.log("Details data:", data);
      alert(`Showing Details for: ${data[1]}`);
    });

    let isHoveringActions = false;

    // Detect mouse entering the actions box
    $table.on("mouseenter", ".row-actions", function () {
      isHoveringActions = true;
    });

    // Detect mouse leaving the actions box
    $table.on("mouseleave", ".row-actions", function () {
      isHoveringActions = false;
    });

    // Move the actions depending on row mouse position
    $table.on("mousemove", "tr", function (e) {
      if (isHoveringActions) return; // ⛔ prevent movement during hover on row-actions

      const $row = $(this);
      const $actions = $row.find(".row-actions");

      if ($actions.length === 0) return;

      const tableOffset = $table.offset().left;
      const mouseX = e.pageX - tableOffset;

      $actions.css({
        left: mouseX + "px",
      });
    });

    // Show actions
    $table.on("mouseenter", "tr", function () {
      $(this).find(".row-actions").css({
        opacity: 1,
        visibility: "visible",
      });
    });

    // Hide actions
    $table.on("mouseleave", "tr", function () {
      // Only hide if not hovering on row-actions
      if (!isHoveringActions) {
        $(this).find(".row-actions").css({
          opacity: 0,
          visibility: "hidden",
        });
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
  const body = document.body;

  const savedTheme = localStorage.getItem("selectedTheme");

  if (savedTheme) {
    applyTheme(savedTheme, false);

    // Notify charts
    document.dispatchEvent(new Event("theme-changed"));
  }

  themeBoxes.forEach((box) => {
    box.addEventListener("click", () => {
      const theme = box.getAttribute("data-content");
      localStorage.setItem("selectedTheme", theme);

      applyTheme(theme, true);

      // Notify charts
      document.dispatchEvent(new Event("theme-changed"));
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

function initThemeSelectAndToggle() {
  const select = document.getElementById("themeSelect");
  const darkToggle = document.querySelector(".toggle_theme");
  const body = document.body;

  if (!select || !darkToggle) return;

  // Initialize based on saved state or system preference
  const savedDark = localStorage.getItem("darkMode");

  if (savedDark === "true") {
    body.classList.add("dark-mode");
    select.value = "dark";
    darkToggle.classList.add("dark");
    darkToggle.setAttribute("aria-checked", "true");
  } else if (savedDark === "false") {
    body.classList.remove("dark-mode");
    select.value = "light";
    darkToggle.classList.remove("dark");
    darkToggle.setAttribute("aria-checked", "false");
  } else {
    // System default
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) body.classList.add("dark-mode");
    else body.classList.remove("dark-mode");
    select.value = "system";
    darkToggle.classList.remove("dark");
    darkToggle.setAttribute("aria-checked", prefersDark ? "true" : "false");
  }

  // ---------------- Dropdown change listener ----------------
  select.addEventListener("change", () => {
    const value = select.value;

    if (value === "light") {
      body.classList.remove("dark-mode");
      darkToggle.classList.remove("dark");
      darkToggle.setAttribute("aria-checked", "false");
      localStorage.setItem("darkMode", "false");
    } else if (value === "dark") {
      body.classList.add("dark-mode");
      darkToggle.classList.add("dark");
      darkToggle.setAttribute("aria-checked", "true");
      localStorage.setItem("darkMode", "true");
    } else if (value === "system") {
      localStorage.removeItem("darkMode");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) body.classList.add("dark-mode");
      else body.classList.remove("dark-mode");
      darkToggle.classList.toggle("dark", prefersDark);
      darkToggle.setAttribute("aria-checked", prefersDark ? "true" : "false");
    }
  });

  // ---------------- Toggle button listener ----------------
  darkToggle.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-mode");
    darkToggle.classList.toggle("dark", isDark);
    darkToggle.setAttribute("aria-checked", isDark);

    // Update select to match the toggle
    if (select.value === "system") {
      // Override system temporarily
      select.value = isDark ? "dark" : "light";
      localStorage.setItem("darkMode", isDark ? "true" : "false");
    } else {
      localStorage.setItem("darkMode", isDark ? "true" : "false");
    }
  });

  // ---------------- System preference listener ----------------
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (select.value === "system") {
      body.classList.toggle("dark-mode", e.matches);
      darkToggle.classList.toggle("dark", e.matches);
      darkToggle.setAttribute("aria-checked", e.matches ? "true" : "false");
    }
  });
}

// Initialize after DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  initThemeSelectAndToggle();
});

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

// ------------------------dashbord cards -------------------------------
// --- NEW GLOBAL FUNCTION DECLARATIONS ---

/**
 * Initializes the main dashboard cards with click handlers to open the breakdown modal.
 */
/**
 * Initialize dashboard cards (after includeHTML finishes loading them)
 */
function initDashboardCards() {
  const cards = document.querySelectorAll(".cards_container .card");

  if (cards.length === 0) {
    console.warn("initDashboardCards: No dashboard cards found.");
    return;
  }

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();

      const metric = card.getAttribute("data-pref-label");
      const dataKey = card.getAttribute("data-pref");

      if (typeof window.openBreakdownModal === "function") {
        window.openBreakdownModal(metric, dataKey);
      } else {
        console.error("openBreakdownModal is not initialized yet!");
      }
    });
  });
}

/**
 * Setup modal functionality. Should only run once after modal HTML loads.
 */
function initBreakdownModal() {
  const popup = document.getElementById("breakdown-popup");
  const closeBtn = document.querySelector(".cps-close-btn");
  const toggleContainer = document.getElementById("modal-card-toggles");

  if (!popup || !toggleContainer) {
    console.error("initBreakdownModal: Missing popup or toggle container.");
    return;
  }

  // Clone dashboard cards into sidebar toggles
  const originalCards = document.querySelectorAll(".cards_container .card");

  toggleContainer.innerHTML = ""; // prevent duplicates if reloaded

  originalCards.forEach((originalCard) => {
    const clonedCard = originalCard.cloneNode(true);

    clonedCard.classList.remove("animate__animated", "animate__fadeInUp");
    clonedCard.removeAttribute("style");
    clonedCard.classList.add("toggle-card");

    clonedCard.addEventListener("click", () => {
      const metric = clonedCard.getAttribute("data-pref-label");
      const dataKey = clonedCard.getAttribute("data-pref");

      loadBreakdownTable(metric, dataKey);
      highlightToggleCard(dataKey);
    });

    toggleContainer.appendChild(clonedCard);
  });

  // Close modal
  closeBtn?.addEventListener("click", () => popup.classList.remove("open"));

  window.addEventListener("click", (e) => {
    if (e.target === popup) popup.classList.remove("open");
  });

  // Expose global function
  window.openBreakdownModal = (metric, dataKey) => {
    popup.classList.add("open");
    loadBreakdownTable(metric, dataKey);
    highlightToggleCard(dataKey);
  };

  console.log("Breakdown modal initialized.");
}

/**
 * Highlight active toggle card in sidebar
 */
function highlightToggleCard(activeKey) {
  const sidebarCards = document.querySelectorAll("#modal-card-toggles .toggle-card");

  sidebarCards.forEach((card) => {
    card.classList.toggle("active", card.getAttribute("data-pref") === activeKey);

    if (card.classList.contains("active")) {
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

/**
 * Load table data into modal content area
 */
function loadBreakdownTable(metric, dataKey) {
  const tableContainer = document.getElementById("breakdown-table-container");
  const titleElement = document.getElementById("breakdown-title");

  if (!tableContainer || !titleElement) return;

  titleElement.textContent = `Detailed Breakdown: ${metric}`;
  tableContainer.innerHTML = `<p class="loading-state">Loading data for <b>${metric}</b>...</p>`;

  setTimeout(() => {
    let tableHTML = "";

    switch (dataKey) {
      case "todayGateIn":
      case "GateInToday":
        tableHTML = `
          <table class="data-table cps-data-table" data-datatable="true">
              <thead>
                  <tr><th>Container ID</th><th>Size</th><th>Time In</th><th>Transporter</th><th>Status</th></tr>
              </thead>
              <tbody>
                  <tr><td>C-IN-0042</td><td>20ft</td><td>11:05</td><td>Transco</td><td>Processed</td></tr>
                  <tr><td>C-IN-0063</td><td>40ft</td><td>11:15</td><td>Apex</td><td>Inspection</td></tr>
              </tbody>
          </table>
        `;
        break;

      case "YardStockbyTEUs":
      case "ContainersinYard":
        tableHTML = `
          <table class="data-table cps-data-table" data-datatable="true">
              <thead>
                  <tr><th>Location</th><th>TEUs</th><th>Containers</th><th>Last Move</th><th>Hold Status</th></tr>
              </thead>
              <tbody>
                  <tr><td>A-Stack-01</td><td>24</td><td>12</td><td>1d ago</td><td>None</td></tr>
                  <tr><td>B-Stack-05</td><td>16</td><td>8</td><td>3h ago</td><td>Quarantine</td></tr>
              </tbody>
          </table>
        `;
        break;

      case "GateOutToday":
        tableHTML = `
          <table class="data-table cps-data-table" data-datatable="true">
              <thead>
                  <tr><th>Container ID</th><th>Size</th><th>Time Out</th><th>Truck ID</th><th>Driver</th></tr>
              </thead>
              <tbody>
                  <tr><td>C-OUT-0051</td><td>40ft</td><td>09:00</td><td>T-001</td><td>John Doe</td></tr>
              </tbody>
          </table>
        `;
        break;

      default:
        tableHTML = `<p>No breakdown data found for <b>${metric}</b> (Key: ${dataKey}).</p>`;
    }

    tableContainer.innerHTML = tableHTML;

    if (tableContainer.querySelector(".data-table") && typeof initDataTables === "function") {
      initDataTables();
    }
  }, 300);
}

function initChangePassword() {
  const modal = document.getElementById("changePasswordModal");
  const openBtn = document.getElementById("changepassword");
  const closeBtn = modal ? modal.querySelector(".close-button") : null;
  const form = document.getElementById("changePasswordForm");

  // Defensive checks
  if (!modal || !openBtn || !closeBtn || !form) {
    console.warn("initChangePassword: Required elements not found.");
    return;
  }

  // -------- OPEN MODAL --------
  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // -------- CLOSE MODAL --------
  function closeChangePasswordModal() {
    modal.style.display = "none";
  }

  closeBtn.addEventListener("click", closeChangePasswordModal);

  // Close on overlay click
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeChangePasswordModal();
  });

  // -------- TOGGLE PASSWORD VISIBILITY --------
  document.querySelectorAll(".toggle-eye").forEach((icon) => {
    const input = icon.previousElementSibling;
    icon.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      icon.classList.toggle("fa-eye-slash");
    });
  });

  // -------- VALIDATION RULES --------
  function validatePassword() {
    const pwd = document.getElementById("newPassword").value;

    toggleRule("rule-length", pwd.length >= 8);
    toggleRule("rule-upper", /[A-Z]/.test(pwd));
    toggleRule("rule-lower", /[a-z]/.test(pwd));
    toggleRule("rule-number", /[0-9]/.test(pwd));
    toggleRule("rule-symbol", /[!@#$%^&*]/.test(pwd));

    validateConfirmPassword();
  }

  function toggleRule(id, valid) {
    const rule = document.getElementById(id);
    const icon = rule.querySelector(".icon");

    if (valid) {
      rule.classList.add("valid");
      icon.classList.remove("fa-circle-xmark");
      icon.classList.add("fa-circle-check");
    } else {
      rule.classList.remove("valid");
      icon.classList.remove("fa-circle-check");
      icon.classList.add("fa-circle-xmark");
    }
  }

  // -------- CONFIRM PASSWORD MATCH --------
  function validateConfirmPassword() {
    const pwd = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const msg = document.getElementById("confirmMsg");

    if (confirm === "") {
      msg.innerText = "";
      return;
    }

    msg.innerText = pwd !== confirm ? "Passwords do not match" : "";
  }

  // Bind inputs
  document.getElementById("newPassword").addEventListener("input", validatePassword);
  document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);

  // -------- FORM SUBMISSION --------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const pwd = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    const allValid = document.querySelectorAll(".password-rules li.valid").length === 5;

    if (!allValid) {
      alert("Password does not meet all requirements!");
      return;
    }

    if (pwd !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    // SUCCESS
    alert("Password changed successfully!");

    closeChangePasswordModal();
    form.reset();

    // Reset rules
    document.querySelectorAll(".password-rules li").forEach((li) => li.classList.remove("valid"));
  });

  console.log("initChangePassword() initialized.");
}

// ---------------------------------size----------------------------
// ---------------------------------size----------------------------
function applyFontSize(sizeKey, save = true) {
  const root = document.documentElement;

  const sizes = {
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

  Object.entries(sizes[sizeKey]).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (save) {
    localStorage.setItem("selectedFontSize", sizeKey);
  }
}

function initFontSizeSelect() {
  const select = document.getElementById("fontSizeSelect");

  // 👇 FIX for 'Cannot set properties of null (setting 'value')'
  // If the select element is not present in the new page content, exit safely.
  if (!select) {
    console.log(
      "initFontSizeSelect: Element #fontSizeSelect not found on the current page. Skipping initialization.",
    );
    return;
  }

  // Load saved font size
  const saved = localStorage.getItem("selectedFontSize") || "default";
  applyFontSize(saved, false);
  select.value = saved; // This line now runs only if 'select' is a valid element

  // Listen for changes
  select.addEventListener("change", () => {
    const selected = select.value;
    applyFontSize(selected);
  });
}

// load.js - At the end of the script

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // 👇 FIX: Apply the saved font size immediately on every page load.
  const saved = localStorage.getItem("selectedFontSize") || "default";
  applyFontSize(saved, false); // false means don't re-save to localStorage

  // Only attempt to initialize the select element (setup listener)
  // if it exists on the current page (e.g., the Settings page).
  initFontSizeSelect();
});
