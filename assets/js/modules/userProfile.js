/**
 * @module modules/userProfile
 * @description Handles user display: initials fallback, profile completion
 * ring, and profile settings (edit / save / cancel).
 *
 * Usage:
 *   import { initUserInitials, updateProfileCompletion, initsettings }
 *     from './modules/userProfile.js';
 */

import { showToast } from "../utils/dom.js";

// ---------------------------------------------------------------------------
// Initials
// ---------------------------------------------------------------------------

/**
 * Shows user initials when no profile photo is set.
 * Expects `.user_wrapper > .user_name`, `.user_initials`, `.user_img img`.
 */
export function initUserInitials() {
  const wrapper = document.querySelector(".user_wrapper");
  if (!wrapper) return;

  const nameEl = wrapper.querySelector(".user_name");
  const initialsEl = wrapper.querySelector(".user_initials");
  const img = wrapper.querySelector(".user_img img");

  if (!nameEl || !initialsEl || !img) return;

  const initials = getInitials(nameEl.textContent.trim());

  if (img.src.endsWith("user.png")) {
    initialsEl.textContent = initials;
    img.style.display = "none";
    initialsEl.style.display = "flex";
  } else {
    initialsEl.style.display = "none";
    img.style.display = "block";
  }
}

function getInitials(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ---------------------------------------------------------------------------
// Profile completion ring
// ---------------------------------------------------------------------------

/** @type {{ name: string; percent: number; completed: boolean }[]} */
const PROFILE_ITEMS = [
  { name: "Setup account",     percent: 10, completed: true  },
  { name: "Upload your photo", percent: 5,  completed: true  },
  { name: "Personal Info",     percent: 10, completed: true  },
  { name: "Location",          percent: 20, completed: false },
  { name: "Biography",         percent: 15, completed: true  },
  { name: "Notifications",     percent: 10, completed: false },
  { name: "Bank details",      percent: 30, completed: false },
];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Renders the circular progress ring and item list.
 * Requires `#completionPercent`, `#completionItems`, and
 * `.circular_progress .progress` in the DOM.
 */
export function updateProfileCompletion() {
  const percentEl = document.getElementById("completionPercent");
  const itemsEl   = document.getElementById("completionItems");
  const ring      = document.querySelector(".circular_progress .progress");

  if (!percentEl || !itemsEl || !ring) return;

  const total = PROFILE_ITEMS.filter((i) => i.completed)
    .reduce((acc, i) => acc + i.percent, 0);

  // Colour thresholds
  ring.style.stroke =
    total < 50 ? "orange" :
    total < 70 ? "#ffeb3b" :
                 "green";

  ring.style.strokeDashoffset = CIRCUMFERENCE - (total / 100) * CIRCUMFERENCE;
  percentEl.innerText = `${total}%`;

  itemsEl.innerHTML = "";
  PROFILE_ITEMS.forEach(({ name, percent, completed }) => {
    const li = document.createElement("li");
    li.className = completed ? "completed" : "incomplete";
    li.innerHTML = `
      <span>${name}</span>
      <span>${completed ? `${percent}%` : `+${percent}%`}</span>
    `;
    itemsEl.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Settings page (edit / save / cancel)
// ---------------------------------------------------------------------------

/**
 * Wires up the profile settings edit flow.
 * Expects: `#editBtn`, `.cancelBtn`, `.saveBtn`, `.btnText`, `.loader`,
 * `#toast`, and any element with a `[data-field]` attribute.
 */
export function initsettings() {
  const editBtn   = document.getElementById("editBtn");
  const cancelBtn = document.querySelector(".cancelBtn");
  const saveBtn   = document.querySelector(".saveBtn");
  const saveText  = document.querySelector(".btnText");
  const loader    = document.querySelector(".loader");
  const toast     = document.getElementById("toast");

  if (!editBtn || !cancelBtn || !saveBtn || !saveText || !loader || !toast) return;

  const fields = document.querySelectorAll("[data-field]");

  editBtn.addEventListener("click",   () => setEditing(true));
  cancelBtn.addEventListener("click", () => setEditing(false));

  saveBtn.addEventListener("click", () => {
    saveText.style.display = "none";
    loader.style.display   = "inline-block";

    setTimeout(() => {
      fields.forEach((field) => {
        const name      = field.dataset.field;
        const input     = document.getElementById(name);
        const displayId = `display${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        const display   = document.getElementById(displayId);

        if (input && display) display.innerText = input.value;
      });

      loader.style.display   = "none";
      saveText.style.display = "inline-block";
      setEditing(false);
      showToast(toast, "Profile updated successfully!");
    }, 2000);
  });

  function setEditing(on) {
    editBtn.style.display   = on ? "none"         : "inline-block";
    cancelBtn.style.display = on ? "inline-block" : "none";
    saveBtn.style.display   = on ? "inline-block" : "none";

    document.querySelectorAll(".display_text")
      .forEach((el) => (el.style.display = on ? "none"  : "block"));
    document.querySelectorAll(".edit_input")
      .forEach((el) => (el.style.display = on ? "block" : "none"));
  }
}
