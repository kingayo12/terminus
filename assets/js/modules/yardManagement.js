/**
 * @module modules/yardManagement
 * @description Handles the interactive yard view: container population from
 * JSON, drag-and-drop stacking, truck loading, search, and view modes.
 *
 * Usage:
 *   import { init_yardManagement } from './modules/yardManagement.js';
 *   init_yardManagement();
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const YARD_ROWS     = ["A", "B", "C", "D", "E", "F", "G"];
const COLS_PER_ROW  = 6;
const DATA_URL      = "assets/js/data.json";

// Snap-box locations that cannot accept the right side of a wide container
const LAST_COL_LOCATIONS = new Set(
  YARD_ROWS.map((r) => `${r}${COLS_PER_ROW}`)
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init_yardManagement() {
  const modal     = document.querySelector(".add_details-modal");
  const truckForm = document.getElementById("truckForm");

  // Guard: page not loaded
  if (!modal || !truckForm) return;

  // Prevent double-binding across hot reloads
  if (truckForm.dataset.bound === "true") return;
  truckForm.dataset.bound = "true";

  initModalControls(modal, truckForm);
  initViewModes();
  initSearch();

  fetch(DATA_URL)
    .then((r) => r.json())
    .then(({ containers }) => {
      populateContainers(containers);
      initDragAndDrop();
    })
    .catch((err) => console.error("Error loading yard data:", err));
}

// ---------------------------------------------------------------------------
// Modal & truck form
// ---------------------------------------------------------------------------

function initModalControls(modal, form) {
  const truck = document.querySelector(".truck");

  window.handleAddClick   = () => modal.classList.add("showthruck_modal");
  window.handleCloseModal = () => modal.classList.remove("showthruck_modal");

  setTimeout(() => truck?.classList.add("showCont"), 3000);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const spinner = document.querySelector(".loading-spinner");
    spinner?.classList.remove("hidden");

    setTimeout(() => {
      const val = (id) => document.getElementById(id)?.value ?? "";
      document.querySelector(".truck_info .truck_number").textContent  = val("truckNumber");
      document.querySelector(".truck_info .driver_name").textContent   = val("driverName");
      document.querySelector(".truck_info .truck_company").textContent = val("containerType");

      spinner?.classList.add("hidden");
      window.handleCloseModal();
    }, 400);
  });
}

// ---------------------------------------------------------------------------
// View mode controls
// ---------------------------------------------------------------------------

function initViewModes() {
  const cover = document.querySelector(".yard");
  if (!cover || cover.dataset.modeInit === "true") return;
  cover.dataset.modeInit = "true";

  const pics = cover.querySelector("img");
  const mode = (n) => document.querySelector(`.mode${n}`);

  const ISO_CLASSES = ["isometric", "isometric2", "isometric3", "isometric4", "isometric5", "animate"];

  function resetIso() {
    ISO_CLASSES.forEach((c) => cover.classList.remove(c));
    pics?.classList.remove("shadow");
    cover.style.transform = null;
  }

  function resetBtns() {
    for (let i = 1; i <= 8; i++) mode(i)?.classList.remove("comot", "comot2");
  }

  let deg = 0;
  mode(1).disabled = true;

  // 2D / flat
  mode(1)?.addEventListener("click", () => {
    resetIso(); resetBtns();
    cover.classList.add("animate");
    mode(1).disabled = true;
    mode(2).disabled = false;
  });

  // Isometric default
  mode(2)?.addEventListener("click", () => {
    resetIso(); resetBtns();
    cover.classList.add("isometric");
    mode(2).disabled = true;
    mode(1).disabled = false;
    [3, 4, 5, 6].forEach((n) => mode(n)?.classList.add("comot"));
    [7, 8].forEach((n)       => mode(n)?.classList.add("comot2"));
  });

  // Perspective variants
  [["mode3","isometric2"], ["mode4","isometric3"], ["mode5","isometric4"], ["mode6","isometric"]].forEach(
    ([sel, cls]) => {
      const btn = document.querySelector(`.${sel}`);
      btn?.addEventListener("click", () => { resetIso(); cover.classList.add(cls); mode(1).disabled = false; });
    }
  );

  // Rotation
  mode(7)?.addEventListener("click", () => { deg += 90; cover.style.transform = `rotate(${deg}deg)`; });
  mode(8)?.addEventListener("click", () => { deg -= 90; cover.style.transform = `rotate(${deg}deg)`; });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function initSearch() {
  const form  = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  if (!form || !input || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim().toUpperCase();

    document.querySelectorAll(".snap_box").forEach((b) => b.classList.remove("highlight2"));

    if (!query) { alert("Please enter a BL No, Container No, or TDO."); return; }

    let found = false;
    document.querySelectorAll(".container").forEach((c) => {
      const num = c.querySelector(".cont_num")?.textContent.trim().toUpperCase();
      if (num?.includes(query)) {
        c.closest(".snap_box")?.classList.add("highlight2");
        found = true;
      }
    });

    if (!found) alert("No containers found for the entered criteria.");
  });
}

// ---------------------------------------------------------------------------
// DOM population
// ---------------------------------------------------------------------------

export function populateContainers(containers) {
  const yard = document.getElementById("yard");
  if (!yard) return;

  const snapBoxMap = {};

  // Build empty grid
  YARD_ROWS.forEach((row) => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("containers_list");

    const label = document.createElement("h1");
    label.textContent = row;
    rowDiv.appendChild(label);

    for (let i = 1; i <= COLS_PER_ROW; i++) {
      const loc     = `${row}${i}`;
      const snapBox = document.createElement("div");
      snapBox.classList.add("snap_box");
      snapBox.dataset.capacity = 5;
      snapBox.dataset.location = loc;
      snapBox.innerHTML = `<span class="count"></span>`;
      rowDiv.appendChild(snapBox);
      snapBoxMap[loc] = snapBox;
    }
    yard.appendChild(rowDiv);
  });

  // Place containers
  containers.forEach((data, idx) => {
    const snapBox = snapBoxMap[data.location];
    if (!snapBox) return;

    const isLarge = data.size === "40ft" || data.size === "45ft";
    const id      = `cont-${data.size}-${idx}`;

    const el = document.createElement("div");
    el.id = id;
    el.classList.add("container", data.size === "20ft" ? "twenty" : "fortyfive", data.shippingLine);
    el.setAttribute("draggable", "true");
    el.dataset.type = data.size;
    el.innerHTML = `<div class="cont_num">${data.containerNumber}</div>${data.size}`;
    snapBox.appendChild(el);

    if (isLarge) {
      const row         = data.location[0];
      const col         = parseInt(data.location.slice(1));
      const nextSnapBox = snapBoxMap[`${row}${col + 1}`];
      if (nextSnapBox) {
        const ph = createPlaceholder(id);
        nextSnapBox.appendChild(ph);
      }
    }
  });

  // Refresh counts
  document.querySelectorAll(".snap_box").forEach(refreshCount);
}

// ---------------------------------------------------------------------------
// Drag & Drop
// ---------------------------------------------------------------------------

function initDragAndDrop() {
  const allBoxes  = () => [...document.querySelectorAll(".snap_box")];
  const loadTruck = document.querySelector(".loadtruck");
  const freeArea  = document.querySelector(".freeArea"); // update selector as needed
  const errorMsg  = document.querySelector(".er_message");

  let dragged       = null;
  let isOverActions = false;
  let errorTimer    = null;

  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.innerHTML = msg;
    errorMsg.classList.add("show");
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorMsg.classList.remove("show"), 3000);
  }

  // ── Bind containers ───────────────────────────────────────────────────────

  function bindContainer(el) {
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("dragend",   onDragEnd);
  }

  document.querySelectorAll(".container").forEach(bindContainer);

  // ── Snap-box events ───────────────────────────────────────────────────────

  allBoxes().forEach((box) => {
    box.addEventListener("dragover", (e) => {
      e.preventDefault();
      clearHighlights();
      if (dragged) highlightDropAreas(dragged, box, allBoxes());
    });
    box.addEventListener("drop", (e) => {
      e.preventDefault();
      const id  = e.dataTransfer.getData("text/plain");
      const el  = document.getElementById(id);
      const box = e.target.closest(".snap_box");
      if (el && box && isValidDrop(box, el, allBoxes(), showError)) {
        removeFromParent(el, allBoxes(), showError);
        placeInBox(box, el, allBoxes(), bindContainer);
      }
      clearHighlights();
    });
  });

  // ── Truck events ──────────────────────────────────────────────────────────

  loadTruck?.addEventListener("dragover", (e) => { e.preventDefault(); loadTruck.classList.add("highlight"); });
  loadTruck?.addEventListener("drop",     (e) => {
    e.preventDefault();
    const el = document.getElementById(e.dataTransfer.getData("text/plain"));
    if (!el) return;

    if (canDropInTruck(el, loadTruck)) {
      removeFromParent(el, allBoxes(), showError);
      loadTruck.appendChild(el);
      syncTruckCapacity(loadTruck);
      enableDoubleClickToFreeArea(el, loadTruck, freeArea);
    } else {
      showError("Truck capacity reached or incompatible container size!");
    }
    loadTruck.classList.remove("highlight");
  });

  // ── Free area events ──────────────────────────────────────────────────────

  freeArea?.addEventListener("dragover",  (e) => { e.preventDefault(); freeArea.classList.add("highlight"); });
  freeArea?.addEventListener("dragleave", ()  => freeArea.classList.remove("highlight"));
  freeArea?.addEventListener("drop",     (e) => {
    e.preventDefault();
    const el = document.getElementById(e.dataTransfer.getData("text/plain"));
    if (!el) return;
    removeFromParent(el, allBoxes(), showError);
    freeArea.appendChild(el);
    freeArea.classList.remove("highlight");
  });

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function onDragStart(e) {
    const el     = e.target;
    const parent = el.closest(".snap_box");

    if (parent) {
      if (el.nextElementSibling?.classList.contains("container")) {
        showError("Cannot move: Remove the container on top first!");
        e.preventDefault(); return;
      }
      const type = el.dataset.type;
      if (type === "40ft" || type === "45ft") {
        const boxes   = allBoxes();
        const idx     = boxes.indexOf(parent);
        const nextBox = boxes[idx + 1];
        const ph      = nextBox?.querySelector(`[data-related-id="${el.id}"]`);
        if (ph?.nextElementSibling) {
          showError("Cannot move: Adjacent stack has a container on top!");
          e.preventDefault(); return;
        }
      }
    }

    e.dataTransfer.setData("text/plain", el.id);
    dragged = el;
    el.classList.add("dragging");
    clearHighlights();
  }

  function onDragEnd(e) {
    e.target.classList.remove("dragging");
    clearHighlights();
    dragged = null;
  }

  function clearHighlights() {
    allBoxes().forEach((b) => b.classList.remove("highlight", "invalid"));
  }
}

// ---------------------------------------------------------------------------
// Drop logic helpers (pure-ish functions for testability)
// ---------------------------------------------------------------------------

function highlightDropAreas(dragged, startBox, allBoxes) {
  const type     = dragged.dataset.type;
  const needed   = type === "20ft" ? 1 : 2;
  const startIdx = allBoxes.indexOf(startBox);

  for (let i = 0; i < needed; i++) {
    const box = allBoxes[startIdx + i];
    if (!box) break;
    box.classList.add(isValidDrop(box, dragged, allBoxes, () => {}) ? "highlight" : "invalid");
  }
}

function isValidDrop(box, el, allBoxes, showError) {
  const type     = el.dataset.type;
  const needed   = type === "20ft" ? 1 : 2;
  const startIdx = allBoxes.indexOf(box);

  for (let i = 0; i < needed; i++) {
    if (!allBoxes[startIdx + i]) return false;
  }

  if (type === "40ft" || type === "45ft") {
    const first  = allBoxes[startIdx];
    const second = allBoxes[startIdx + 1];
    if (!second) return false;

    if (first.querySelectorAll(".container").length !== second.querySelectorAll(".container").length) {
      showError("Stack levels must be equal to drop a 40ft or 45ft container.");
      return false;
    }
    if (LAST_COL_LOCATIONS.has(box.dataset.location)) {
      showError("Cannot drop a large container in this space!");
      return false;
    }
  }

  for (let i = 0; i < needed; i++) {
    const cur = allBoxes[startIdx + i];
    if (cur.querySelectorAll(".container").length >= Number(cur.dataset.capacity)) {
      showError(`Stack capacity reached (max ${cur.dataset.capacity}).`);
      return false;
    }
  }

  return true;
}

function placeInBox(box, el, allBoxes, bindContainer) {
  const type    = el.dataset.type;
  const isLarge = type === "40ft" || type === "45ft";
  const idx     = allBoxes.indexOf(box);

  box.appendChild(el);
  el.style.zIndex = 999 + box.querySelectorAll(".container").length;
  bindContainer(el);
  refreshCount(box);

  if (isLarge) {
    const next = allBoxes[idx + 1];
    if (next) {
      next.appendChild(createPlaceholder(el.id));
      refreshCount(next);
    }
  }
}

function removeFromParent(el, allBoxes, showError) {
  const parent = el.parentElement;
  if (!parent?.classList.contains("snap_box")) return;

  const type    = el.dataset.type;
  const isLarge = type === "40ft" || type === "45ft";

  if (isLarge) {
    const idx  = allBoxes.indexOf(parent);
    const next = allBoxes[idx + 1];
    const ph   = next?.querySelector(`[data-related-id="${el.id}"]`);
    if (ph) { next.removeChild(ph); refreshCount(next); }
  }

  parent.removeChild(el);
  refreshCount(parent);
}

function canDropInTruck(el, truck) {
  const existing = [...truck.children];
  const type     = el.dataset.type;
  const hasLarge = existing.some((c) => ["40ft", "45ft"].includes(c.dataset.type));

  if (hasLarge) return false;
  if (["40ft", "45ft"].includes(type)) return existing.length === 0;
  return type === "20ft" && existing.length < 2;
}

function syncTruckCapacity(truck) {
  const children = truck.children;
  const full =
    children.length >= 2 ||
    (children.length === 1 && ["40ft", "45ft"].includes(children[0].dataset.type));
  truck.classList.toggle("full", full);
}

function enableDoubleClickToFreeArea(el, truck, freeArea) {
  if (!freeArea) return;

  el.addEventListener("dblclick", () => {
    const rect     = el.getBoundingClientRect();
    const faRect   = freeArea.getBoundingClientRect();
    const x = Math.random() * (faRect.width  - el.clientWidth);
    const y = Math.random() * (faRect.height - el.clientHeight);

    const clone = el.cloneNode(true);
    Object.assign(clone.style, {
      position:   "absolute",
      left:       `${rect.left}px`,
      top:        `${rect.top}px`,
      width:      `${el.clientWidth}px`,
      height:     `${el.clientHeight}px`,
      zIndex:     "1000",
      transition: "all 0.5s ease",
    });
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = `${faRect.left + x}px`;
      clone.style.top  = `${faRect.top  + y}px`;
    });

    setTimeout(() => {
      clone.remove();
      truck.removeChild(el);
      freeArea.appendChild(el);
      el.classList.add("in-free-area");
    }, 500);
  });
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function createPlaceholder(relatedId) {
  const ph = document.createElement("div");
  ph.classList.add("container", "placeholder-hidden");
  ph.style.display = "none";
  ph.dataset.relatedId = relatedId;
  return ph;
}

function refreshCount(box) {
  const count    = box.querySelectorAll(".container").length;
  const max      = Number(box.dataset.capacity);
  const countEl  = box.querySelector(".count");
  if (countEl) countEl.innerHTML = `${count} <sub>${max - count}</sub>`;
  box.classList.toggle("occupied", count > 0);
}
