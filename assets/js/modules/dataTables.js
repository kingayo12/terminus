/**
 * @module modules/dataTables
 * @description Initialises jQuery DataTables for every table marked with
 * `data-datatable="true"`. Action buttons are injected dynamically based
 * on the `data-actions` attribute (comma-separated list).
 *
 * Usage:
 *   import { initDataTables } from './modules/dataTables.js';
 *   initDataTables();
 *
 * HTML example:
 *   <table data-datatable="true" data-actions="edit,delete,preview">…</table>
 */

// ---------------------------------------------------------------------------
// Config — add new actions here without touching anything else
// ---------------------------------------------------------------------------

/** @type {Record<string, string>} */
const ACTION_TEMPLATES = {
  edit: `<button class="action-btn edit" title="Edit"><i class="fa fa-edit"></i></button>`,
  delete: `<button class="action-btn delete" title="Delete"><i class="fa fa-trash"></i></button>`,
  preview: `<button class="action-btn preview" title="Preview"><i class="fa fa-eye"></i></button>`,
  details: `<button class="action-btn details" title="Details"><i class="fa fa-info-circle"></i></button>`,
};

// ---------------------------------------------------------------------------
// Handlers — extend this map to add click behaviour for new action types
// ---------------------------------------------------------------------------

/**
 * @type {Record<string, (data: unknown[]) => void>}
 */
const ACTION_HANDLERS = {
  edit: (data) => alert(`Editing Record: S/N ${data[0]}`),
  delete: (data, row, table) => {
    if (confirm(`Delete Record: S/N ${data[0]}?`)) table.row(row).remove().draw();
  },
  preview: (data) => alert(`Previewing Record: ${data[1]} (Code: ${data[2]})`),
  details: (data) => alert(`Showing Details for: ${data[1]}`),
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scans the document for un-initialised DataTables and sets them up.
 * Safe to call multiple times – already-initialised tables are skipped.
 */
export function initDataTables() {
  if (typeof $ === "undefined" || typeof $.fn.DataTable === "undefined") return;

  $('table[data-datatable="true"]').each(function () {
    if ($.fn.dataTable.isDataTable(this)) return;

    const $table = $(this);
    const actionsHtml = buildActionsHtml($table.data("actions"));
    const rowActionsHtml = actionsHtml
      ? `<div class="row-actions">${actionsHtml}</div>`
      : "";

    const dtInstance = $table.DataTable({
      stateSave: true,
      lengthMenu: [10, 25, 50, -1],
      dom: "Bfrtip",
      pageLength: 5,
      responsive: true,
      buttons: buildExportButtons(),
      createdRow(row) {
        if (rowActionsHtml) $(row).find("td:last").append(rowActionsHtml);
      },
    });

    bindActionHandlers($table, dtInstance);
    bindRowHoverBehaviour($table);
  });
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function buildActionsHtml(actionAttr) {
  if (!actionAttr) return "";
  return actionAttr
    .split(",")
    .map((a) => ACTION_TEMPLATES[a.trim()] ?? "")
    .join("");
}

function buildExportButtons() {
  return [
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
  ];
}

function bindActionHandlers($table, dtInstance) {
  Object.keys(ACTION_HANDLERS).forEach((action) => {
    $table.on("click", `.action-btn.${action}`, function () {
      const row = $(this).closest("tr");
      const data = dtInstance.row(row).data();
      ACTION_HANDLERS[action](data, row, dtInstance);
    });
  });
}

function bindRowHoverBehaviour($table) {
  let isHoveringActions = false;

  $table
    .on("mouseenter", ".row-actions", () => { isHoveringActions = true; })
    .on("mouseleave", ".row-actions", () => { isHoveringActions = false; })
    .on("mousemove", "tr", function (e) {
      if (isHoveringActions) return;
      const $actions = $(this).find(".row-actions");
      if (!$actions.length) return;
      $actions.css("left", `${e.pageX - $table.offset().left}px`);
    })
    .on("mouseenter", "tr", function () {
      $(this).find(".row-actions").css({ opacity: 1, visibility: "visible" });
    })
    .on("mouseleave", "tr", function () {
      if (!isHoveringActions) {
        $(this).find(".row-actions").css({ opacity: 0, visibility: "hidden" });
      }
    });
}
