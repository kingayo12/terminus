/**
 * @module modules/dashboard
 * @description Dashboard metric cards and the breakdown detail modal.
 *
 * Usage:
 *   import { initDashboardCards, initBreakdownModal }
 *     from './modules/dashboard.js';
 *   // Call initBreakdownModal first so openBreakdownModal is ready,
 *   // then initDashboardCards to wire card clicks.
 *   initBreakdownModal();
 *   initDashboardCards();
 */

import { initDataTables } from "./dataTables.js";

// ---------------------------------------------------------------------------
// Breakdown data config
// Add or update case keys to support new card metrics without touching logic.
// ---------------------------------------------------------------------------

/** @type {Record<string, { columns: string[]; rows: string[][] }>} */
const BREAKDOWN_DATA = {
  todayGateIn: {
    columns: ["Container ID", "Size", "Time In", "Transporter", "Status"],
    rows: [
      ["C-IN-0042", "20ft", "11:05", "Transco", "Processed"],
      ["C-IN-0063", "40ft", "11:15", "Apex",    "Inspection"],
    ],
  },
  GateInToday: "todayGateIn", // alias

  YardStockbyTEUs: {
    columns: ["Location", "TEUs", "Containers", "Last Move", "Hold Status"],
    rows: [
      ["A-Stack-01", "24", "12", "1d ago", "None"],
      ["B-Stack-05", "16", "8",  "3h ago", "Quarantine"],
    ],
  },
  ContainersinYard: "YardStockbyTEUs", // alias

  GateOutToday: {
    columns: ["Container ID", "Size", "Time Out", "Truck ID", "Driver"],
    rows: [
      ["C-OUT-0051", "40ft", "09:00", "T-001", "John Doe"],
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attaches click listeners to every `.cards_container .card` element.
 * Must be called AFTER `initBreakdownModal()`.
 */
export function initDashboardCards() {
  const cards = document.querySelectorAll(".cards_container .card");
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const metric  = card.getAttribute("data-pref-label");
      const dataKey = card.getAttribute("data-pref");
      window.openBreakdownModal?.(metric, dataKey);
    });
  });
}

/**
 * Builds the sidebar card toggles inside the breakdown modal and wires
 * all interactions. Exposes `window.openBreakdownModal(metric, dataKey)`.
 */
export function initBreakdownModal() {
  const popup           = document.getElementById("breakdown-popup");
  const closeBtn        = document.querySelector(".cps-close-btn");
  const toggleContainer = document.getElementById("modal-card-toggles");

  if (!popup || !toggleContainer) return;

  // Clone dashboard cards into the modal sidebar (idempotent)
  toggleContainer.innerHTML = "";
  document.querySelectorAll(".cards_container .card").forEach((original) => {
    const clone = original.cloneNode(true);
    clone.classList.remove("animate__animated", "animate__fadeInUp");
    clone.removeAttribute("style");
    clone.classList.add("toggle-card");

    clone.addEventListener("click", () => {
      loadBreakdownTable(
        clone.getAttribute("data-pref-label"),
        clone.getAttribute("data-pref"),
      );
      highlightToggleCard(clone.getAttribute("data-pref"));
    });

    toggleContainer.appendChild(clone);
  });

  // Close handlers
  closeBtn?.addEventListener("click",  () => popup.classList.remove("open"));
  window.addEventListener("click", (e) => {
    if (e.target === popup) popup.classList.remove("open");
  });

  // Global opener
  window.openBreakdownModal = (metric, dataKey) => {
    popup.classList.add("open");
    loadBreakdownTable(metric, dataKey);
    highlightToggleCard(dataKey);
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function highlightToggleCard(activeKey) {
  document.querySelectorAll("#modal-card-toggles .toggle-card").forEach((card) => {
    const isActive = card.getAttribute("data-pref") === activeKey;
    card.classList.toggle("active", isActive);
    if (isActive) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

function loadBreakdownTable(metric, dataKey) {
  const container = document.getElementById("breakdown-table-container");
  const title     = document.getElementById("breakdown-title");
  if (!container || !title) return;

  title.textContent = `Detailed Breakdown: ${metric}`;
  container.innerHTML = `<p class="loading-state">Loading data for <b>${metric}</b>…</p>`;

  setTimeout(() => {
    const tableHtml = buildTable(dataKey, metric);
    container.innerHTML = tableHtml;

    if (container.querySelector(".cps-data-table")) {
      initDataTables();
    }
  }, 300);
}

/**
 * Builds an HTML table string for the given dataKey.
 * Resolves aliases and falls back to a "no data" message.
 */
function buildTable(dataKey, metric) {
  // Resolve alias
  let config = BREAKDOWN_DATA[dataKey];
  if (typeof config === "string") config = BREAKDOWN_DATA[config];

  if (!config) {
    return `<p>No breakdown data found for <b>${metric}</b> (Key: ${dataKey}).</p>`;
  }

  const thead = config.columns.map((c) => `<th>${c}</th>`).join("");
  const tbody = config.rows
    .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");

  return `
    <table class="data-table cps-data-table" data-datatable="true">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  `;
}
