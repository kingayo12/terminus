/**
 * @module modules/settings
 * @description Powers every tab on the settings page.
 * Import and call initSettings() from PAGE_CALLBACKS in main.js.
 *
 * Each sub-init function guards against missing elements so it exits
 * silently on pages that don't contain the relevant HTML.
 */

import { showToast } from "../utils/dom.js";

// ─────────────────────────────────────────────────────────────────────────────
// Entry point — called by PAGE_CALLBACKS after every page load
// ─────────────────────────────────────────────────────────────────────────────

export function initSettings() {
  const page = document.querySelector(".settings");
  if (!page) return; // not on the settings page

  // Activate first tab if none is active
  const firstLink = page.querySelector(".settings_menu .navlink");
  const firstTab = page.querySelector(".tabPage");
  if (firstLink && !page.querySelector(".navlink.active")) {
    firstLink.classList.add("active");
    firstTab?.classList.add("active");
  }

  // Wire every tab's specific logic
  initRolesPermissions();
  initAuditTrail();
  initBranding();
  initIntegrations();
  initCommunicationSettings();
  initModulesControl();
  initImportExport();
  initAutomations();
  initLogs();
  initServerStatus();
  initStorage();
  initApiKeys();
  initApiRateLimits();
  initCompliance();
  initModalCloseButtons(); // generic [data-close] handler for all modals
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic modal close — any element with data-close="modalId" closes that modal
// ─────────────────────────────────────────────────────────────────────────────

function initModalCloseButtons() {
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.close);
      if (modal) modal.style.display = "none";
    });
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = "flex";
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast helper (re-uses the shared utility but targets the settings toast)
// ─────────────────────────────────────────────────────────────────────────────

function toast(msg) {
  showToast(document.getElementById("toast"), msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

const ROLES_KEY = "app_roles";

const DEFAULT_ROLES = [
  { id: 1, name: "Admin", description: "Full system access", color: "#ef4444" },
  { id: 2, name: "Manager", description: "Access to operational modules", color: "#f97316" },
  { id: 3, name: "User", description: "Standard user access", color: "#3b82f6" },
  { id: 4, name: "Viewer", description: "Read-only access", color: "#6b7280" },
];

const PERMISSION_MODULES = [
  "Dashboard",
  "Gate Management",
  "Yard Management",
  "Invoicing",
  "Reports",
  "User Management",
  "Settings",
  "API Access",
];

function loadRoles() {
  try {
    return JSON.parse(localStorage.getItem(ROLES_KEY)) || DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

function saveRoles(roles) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

function initRolesPermissions() {
  const rolesList = document.getElementById("rolesList");
  const matrixBody = document.getElementById("permissionMatrixBody");
  const addRoleBtn = document.getElementById("addRoleBtn");
  const roleForm = document.getElementById("roleForm");

  if (!rolesList) return;

  function renderRoles() {
    const roles = loadRoles();
    rolesList.innerHTML = "";
    roles.forEach((role) => {
      const div = document.createElement("div");
      div.className = "role-item";
      div.innerHTML = `
        <div class="role-dot" style="background:${role.color}"></div>
        <div class="role-info">
          <strong>${role.name}</strong>
          <p>${role.description}</p>
        </div>
        <div class="role-actions">
          <button class="btn btn-secondary btn-small" data-edit-role="${role.id}">
            <i class="fa fa-edit"></i>
          </button>
          <button class="btn btn-error btn-small" data-delete-role="${role.id}">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
      rolesList.appendChild(div);
    });

    renderPermissionMatrix(roles);
  }

  function renderPermissionMatrix(roles) {
    if (!matrixBody) return;
    const roleNames = roles.map((r) => r.name);

    matrixBody.innerHTML = PERMISSION_MODULES.map(
      (mod) => `
      <tr>
        <td>${mod}</td>
        ${roleNames
          .map(
            (_, i) => `
          <td>
            <input type="checkbox" class="perm-checkbox"
              data-module="${mod}" data-role-index="${i}"
              ${i === 0 ? "checked" : i === 1 && mod !== "Settings" && mod !== "API Access" ? "checked" : ""}
            >
          </td>
        `,
          )
          .join("")}
      </tr>
    `,
    ).join("");

    // Save on change
    matrixBody.querySelectorAll(".perm-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => toast("Permissions updated."));
    });
  }

  // Open add modal
  addRoleBtn?.addEventListener("click", () => {
    document.getElementById("roleModalTitle").innerHTML =
      '<i class="fa-solid fa-user-shield"></i> New Role';
    document.getElementById("roleForm").reset();
    openModal("roleModal");
  });

  // Edit role
  rolesList.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit-role]");
    const deleteBtn = e.target.closest("[data-delete-role]");

    if (editBtn) {
      const roles = loadRoles();
      const role = roles.find((r) => r.id === Number(editBtn.dataset.editRole));
      if (!role) return;
      document.getElementById("roleModalTitle").innerHTML =
        '<i class="fa-solid fa-edit"></i> Edit Role';
      document.getElementById("roleName").value = role.name;
      document.getElementById("roleDescription").value = role.description;
      document.getElementById("roleColor").value = role.color;
      roleForm.dataset.editId = role.id;
      openModal("roleModal");
    }

    if (deleteBtn) {
      const roleId = Number(deleteBtn.dataset.deleteRole);
      if (!confirm("Delete this role?")) return;
      const roles = loadRoles().filter((r) => r.id !== roleId);
      saveRoles(roles);
      renderRoles();
      toast("Role deleted.");
    }
  });

  // Form submit
  roleForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const roles = loadRoles();
    const editId = Number(roleForm.dataset.editId);

    const payload = {
      name: document.getElementById("roleName").value.trim(),
      description: document.getElementById("roleDescription").value.trim(),
      color: document.getElementById("roleColor").value,
    };

    if (editId) {
      const idx = roles.findIndex((r) => r.id === editId);
      if (idx !== -1) roles[idx] = { ...roles[idx], ...payload };
      delete roleForm.dataset.editId;
    } else {
      payload.id = Date.now();
      roles.push(payload);
    }

    saveRoles(roles);
    closeModal("roleModal");
    renderRoles();
    toast("Role saved.");
  });

  renderRoles();
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────

function initAuditTrail() {
  const applyBtn = document.getElementById("applyAuditFilter");
  const clearBtn = document.getElementById("clearAuditFilter");
  const exportBtn = document.getElementById("exportAuditBtn");

  if (!applyBtn) return;

  applyBtn.addEventListener("click", () => {
    toast("Filter applied — in production this queries the server.");
  });

  clearBtn?.addEventListener("click", () => {
    ["auditFilterUser", "auditFilterAction", "auditFrom", "auditTo"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    toast("Filter cleared.");
  });

  exportBtn?.addEventListener("click", () => {
    simulateDownload("audit-trail.csv");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDING
// ─────────────────────────────────────────────────────────────────────────────

function initBranding() {
  const saveBtn = document.getElementById("saveBrandingBtn");
  if (!saveBtn) return;

  // Logo upload preview
  wireFilePreview("uploadLogoBtn", "logoInput", "logoPreview");
  wireFilePreview("uploadFaviconBtn", "faviconInput", "faviconPreview");

  saveBtn.addEventListener("click", () => {
    const data = {
      companyName: document.getElementById("brandCompanyName")?.value,
      tagline: document.getElementById("brandTagline")?.value,
      email: document.getElementById("brandEmail")?.value,
      phone: document.getElementById("brandPhone")?.value,
      primaryColor: document.getElementById("brandPrimaryColor")?.value,
      accentColor: document.getElementById("brandAccentColor")?.value,
    };
    localStorage.setItem("branding", JSON.stringify(data));
    toast("Branding saved successfully.");
  });

  // Restore saved branding
  try {
    const saved = JSON.parse(localStorage.getItem("branding"));
    if (saved) {
      if (saved.companyName) document.getElementById("brandCompanyName").value = saved.companyName;
      if (saved.tagline) document.getElementById("brandTagline").value = saved.tagline;
      if (saved.email) document.getElementById("brandEmail").value = saved.email;
      if (saved.phone) document.getElementById("brandPhone").value = saved.phone;
      if (saved.primaryColor)
        document.getElementById("brandPrimaryColor").value = saved.primaryColor;
      if (saved.accentColor) document.getElementById("brandAccentColor").value = saved.accentColor;
    }
  } catch (_) {}
}

function wireFilePreview(btnId, inputId, previewId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!btn || !input || !preview) return;

  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:100%;max-height:80px;object-fit:contain;">`;
    };
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS
// ─────────────────────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "Stripe", icon: "fa-brands fa-stripe", desc: "Payment processing", connected: false },
  { name: "Slack", icon: "fa-brands fa-slack", desc: "Team notifications", connected: true },
  {
    name: "Google Drive",
    icon: "fa-brands fa-google-drive",
    desc: "Cloud document storage",
    connected: false,
  },
  {
    name: "QuickBooks",
    icon: "fa-solid fa-book",
    desc: "Accounting integration",
    connected: false,
  },
  { name: "Twilio", icon: "fa-solid fa-comment-sms", desc: "SMS messaging", connected: true },
  { name: "Zapier", icon: "fa-solid fa-bolt", desc: "Workflow automation", connected: false },
  {
    name: "Microsoft Teams",
    icon: "fa-brands fa-microsoft",
    desc: "Team collaboration",
    connected: false,
  },
  { name: "Webhooks", icon: "fa-solid fa-plug", desc: "Custom HTTP webhooks", connected: true },
];

function initIntegrations() {
  const grid = document.getElementById("integrationsGrid");
  if (!grid) return;

  function render() {
    grid.innerHTML = INTEGRATIONS.map(
      (item, i) => `
      <div class="integration-card ${item.connected ? "connected" : ""}">
        <div class="integration-icon"><i class="${item.icon}"></i></div>
        <div class="integration-info">
          <strong>${item.name}</strong>
          <p>${item.desc}</p>
        </div>
        <button class="btn ${item.connected ? "btn-error" : "btn-primary"} btn-small"
                data-int-index="${i}">
          ${item.connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    `,
    ).join("");
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-int-index]");
    if (!btn) return;
    const idx = Number(btn.dataset.intIndex);
    INTEGRATIONS[idx].connected = !INTEGRATIONS[idx].connected;
    toast(
      `${INTEGRATIONS[idx].name} ${INTEGRATIONS[idx].connected ? "connected" : "disconnected"}.`,
    );
    render();
  });

  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNICATION SETTINGS (SMTP / SMS / Templates)
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS = {
  welcome: {
    subject: "Welcome to Terminus",
    body: "Dear {{name}},\n\nWelcome aboard! Your account is ready.",
  },
  otp: { subject: "Your verification code", body: "Your OTP is: {{code}}. Valid for 5 minutes." },
  gate_in: {
    subject: "Gate-In Confirmed — {{date}}",
    body: "Container {{container}} entered the yard at {{time}}.",
  },
  gate_out: {
    subject: "Gate-Out Confirmed — {{date}}",
    body: "Container {{container}} left the yard at {{time}}.",
  },
  invoice: {
    subject: "Invoice {{invoice_no}} Due",
    body: "Dear {{name}},\n\nYour invoice {{invoice_no}} of ₦{{amount}} is due on {{due_date}}.",
  },
  password_reset: {
    subject: "Password Reset Request",
    body: "Click the link to reset your password: {{link}}",
  },
};

function initCommunicationSettings() {
  const testSmtpBtn = document.getElementById("testSmtpBtn");
  const saveSmtpBtn = document.getElementById("saveSmtpBtn");
  const testSmsBtn = document.getElementById("testSmsBtn");
  const saveSmtBtn = document.getElementById("saveSmtBtn"); // SMS save btn
  const templateSel = document.getElementById("templateSelect");
  const saveTemplBtn = document.getElementById("saveTemplateBtn");

  if (!testSmtpBtn && !templateSel) return;

  testSmtpBtn?.addEventListener("click", () => toast("Test email queued — check your inbox."));
  saveSmtpBtn?.addEventListener("click", () => toast("SMTP configuration saved."));
  testSmsBtn?.addEventListener("click", () => toast("Test SMS sent."));
  saveSmtBtn?.addEventListener("click", () => toast("SMS configuration saved."));

  // Load template content on select change
  templateSel?.addEventListener("change", () => {
    const tpl = TEMPLATE_DEFAULTS[templateSel.value];
    if (!tpl) return;
    const subjectEl = document.getElementById("templateSubject");
    const bodyEl = document.getElementById("templateBody");
    if (subjectEl) subjectEl.value = tpl.subject;
    if (bodyEl) bodyEl.value = tpl.body;
  });

  // Trigger once to populate on load
  if (templateSel) templateSel.dispatchEvent(new Event("change"));

  saveTemplBtn?.addEventListener("click", () => toast("Template saved."));
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES CONTROL
// ─────────────────────────────────────────────────────────────────────────────

const MODULES_KEY = "app_modules";

const APP_MODULES = [
  {
    id: "gate",
    name: "Gate Management",
    icon: "fa-solid fa-door-open",
    desc: "Manage gate-in and gate-out operations.",
    enabled: true,
  },
  {
    id: "yard",
    name: "Yard Management",
    icon: "fa-solid fa-warehouse",
    desc: "Interactive yard grid and container placement.",
    enabled: true,
  },
  {
    id: "invoicing",
    name: "Invoicing",
    icon: "fa-solid fa-file-invoice",
    desc: "Generate and manage customer invoices.",
    enabled: true,
  },
  {
    id: "reports",
    name: "Reports",
    icon: "fa-solid fa-chart-bar",
    desc: "Analytics, charts, and exportable reports.",
    enabled: true,
  },
  {
    id: "vessel",
    name: "Vessel Management",
    icon: "fa-solid fa-ship",
    desc: "Track vessel arrivals, departures and cargo.",
    enabled: false,
  },
  {
    id: "customs",
    name: "Customs Clearance",
    icon: "fa-solid fa-stamp",
    desc: "Manage customs documentation and approvals.",
    enabled: false,
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: "fa-solid fa-wrench",
    desc: "Schedule and track equipment maintenance.",
    enabled: false,
  },
  {
    id: "crm",
    name: "CRM",
    icon: "fa-solid fa-handshake",
    desc: "Customer relationship management.",
    enabled: false,
  },
];

function initModulesControl() {
  const grid = document.getElementById("modulesGrid");
  if (!grid) return;

  // Load saved state
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(MODULES_KEY)) || {};
  } catch (_) {}
  const modules = APP_MODULES.map((m) => ({
    ...m,
    enabled: saved[m.id] !== undefined ? saved[m.id] : m.enabled,
  }));

  function render() {
    grid.innerHTML = modules
      .map(
        (m) => `
      <div class="module-card ${m.enabled ? "enabled" : "disabled"}">
        <div class="module-icon"><i class="${m.icon}"></i></div>
        <div class="module-info">
          <strong>${m.name}</strong>
          <p>${m.desc}</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="module_${m.id}" ${m.enabled ? "checked" : ""}
                 data-module-id="${m.id}" aria-label="Toggle ${m.name}">
          <label for="module_${m.id}" class="toggle-label"></label>
        </div>
      </div>
    `,
      )
      .join("");
  }

  grid.addEventListener("change", (e) => {
    const cb = e.target.closest("[data-module-id]");
    if (!cb) return;
    const mod = modules.find((m) => m.id === cb.dataset.moduleId);
    if (!mod) return;
    mod.enabled = cb.checked;

    const state = {};
    modules.forEach((m) => {
      state[m.id] = m.enabled;
    });
    localStorage.setItem(MODULES_KEY, JSON.stringify(state));
    toast(`${mod.name} ${mod.enabled ? "enabled" : "disabled"}.`);
    render(); // re-render to update card class
  });

  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT / EXPORT
// ─────────────────────────────────────────────────────────────────────────────

function initImportExport() {
  const startImport = document.getElementById("startImportBtn");
  const startExport = document.getElementById("startExportBtn");
  const downloadTpl = document.getElementById("downloadTemplateBtn");
  const progress = document.getElementById("importProgress");
  const fill = document.getElementById("importProgressFill");
  const label = document.getElementById("importProgressLabel");

  if (!startImport && !startExport) return;

  startImport?.addEventListener("click", () => {
    const file = document.getElementById("importFile")?.files[0];
    if (!file) {
      toast("Please select a file first.");
      return;
    }

    progress.style.display = "flex";
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.floor(Math.random() * 15) + 5;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        toast("Import complete!");
      }
      fill.style.width = pct + "%";
      label.textContent = pct + "%";
    }, 300);
  });

  startExport?.addEventListener("click", () => {
    const type = document.getElementById("exportType")?.value || "data";
    const format = document.getElementById("exportFormat")?.value || "csv";
    toast(`Exporting ${type} as ${format.toUpperCase()}…`);
    setTimeout(() => simulateDownload(`export_${Date.now()}.${format}`), 1200);
  });

  downloadTpl?.addEventListener("click", (e) => {
    e.preventDefault();
    simulateDownload("import_template.csv");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIONS
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_KEY = "app_automations";

const DEFAULT_AUTOMATIONS = [
  {
    id: 1,
    name: "Gate-In Email Alert",
    trigger: "gate_in",
    action: "send_email",
    target: "ops@company.com",
    active: true,
  },
  {
    id: 2,
    name: "Capacity Warning SMS",
    trigger: "capacity_warning",
    action: "send_sms",
    target: "+234 800 000 0001",
    active: true,
  },
  {
    id: 3,
    name: "Overdue Invoice Slack",
    trigger: "invoice_due",
    action: "create_notification",
    target: "#billing-channel",
    active: false,
  },
];

function initAutomations() {
  const list = document.getElementById("automationsList");
  const newBtn = document.getElementById("newAutomationBtn");
  const form = document.getElementById("automationForm");
  const trigger = document.getElementById("autoTrigger");
  const action = document.getElementById("autoAction");
  const whGroup = document.getElementById("autoWebhookGroup");

  if (!list) return;

  let automations = (() => {
    try {
      return JSON.parse(localStorage.getItem(AUTO_KEY)) || DEFAULT_AUTOMATIONS;
    } catch {
      return DEFAULT_AUTOMATIONS;
    }
  })();

  function save() {
    localStorage.setItem(AUTO_KEY, JSON.stringify(automations));
  }

  function render() {
    list.innerHTML =
      automations.length === 0
        ? `<p class="setting-detail">No automation rules yet. Click "New Automation" to create one.</p>`
        : automations
            .map(
              (a) => `
          <div class="automation-item ${a.active ? "active" : ""}">
            <div class="automation-info">
              <strong>${a.name}</strong>
              <p>When <em>${a.trigger.replace(/_/g, " ")}</em> → ${a.action.replace(/_/g, " ")} → ${a.target}</p>
            </div>
            <div class="automation-controls">
              <div class="toggle-switch">
                <input type="checkbox" id="auto_${a.id}" ${a.active ? "checked" : ""}
                       data-auto-id="${a.id}" aria-label="Toggle automation">
                <label for="auto_${a.id}" class="toggle-label"></label>
              </div>
              <button class="btn btn-error btn-small" data-delete-auto="${a.id}">
                <i class="fa fa-trash"></i>
              </button>
            </div>
          </div>
        `,
            )
            .join("");
  }

  // Toggle active
  list.addEventListener("change", (e) => {
    const cb = e.target.closest("[data-auto-id]");
    if (!cb) return;
    const item = automations.find((a) => a.id === Number(cb.dataset.autoId));
    if (item) {
      item.active = cb.checked;
      save();
      render();
      toast("Automation updated.");
    }
  });

  // Delete
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-auto]");
    if (!btn || !confirm("Delete this automation?")) return;
    automations = automations.filter((a) => a.id !== Number(btn.dataset.deleteAuto));
    save();
    render();
    toast("Automation deleted.");
  });

  // Show/hide webhook field
  action?.addEventListener("change", () => {
    if (whGroup) whGroup.style.display = action.value === "webhook" ? "block" : "none";
  });

  newBtn?.addEventListener("click", () => {
    form?.reset();
    if (whGroup) whGroup.style.display = "none";
    openModal("automationModal");
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const rule = {
      id: Date.now(),
      name: document.getElementById("autoName").value.trim(),
      trigger: document.getElementById("autoTrigger").value,
      action: document.getElementById("autoAction").value,
      target: document.getElementById("autoTarget").value.trim(),
      message: document.getElementById("autoMessage").value.trim(),
      active: true,
    };
    automations.push(rule);
    save();
    closeModal("automationModal");
    render();
    toast("Automation rule created.");
  });

  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM LOGS
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_LOGS = [
  {
    level: "info",
    time: "2025-12-07 10:32:01",
    msg: "User john@mail.com logged in from 192.168.1.10",
  },
  { level: "info", time: "2025-12-07 10:45:12", msg: "Container C-IN-0099 added to yard slot A3" },
  {
    level: "warn",
    time: "2025-12-07 11:00:05",
    msg: "Yard capacity reached 82% — nearing threshold",
  },
  { level: "error", time: "2025-12-07 11:15:33", msg: "Email delivery failed for invoice INV-005" },
  { level: "debug", time: "2025-12-07 11:16:00", msg: "Retry queued for email INV-005 in 60s" },
  { level: "info", time: "2025-12-07 12:00:00", msg: "Scheduled backup completed successfully" },
  {
    level: "warn",
    time: "2025-12-07 13:22:45",
    msg: "Unusual login detected for user jane@mail.com",
  },
  {
    level: "error",
    time: "2025-12-07 14:01:11",
    msg: "Database query timeout on report generation",
  },
  {
    level: "info",
    time: "2025-12-07 15:30:00",
    msg: "API key sk_live_••ABCD accessed /containers endpoint",
  },
  { level: "debug", time: "2025-12-07 15:30:01", msg: "Response: 200 OK (134ms)" },
];

const LOG_COLORS = { info: "#3b82f6", warn: "#f59e0b", error: "#ef4444", debug: "#6b7280" };

function initLogs() {
  const console_ = document.getElementById("logConsole");
  const levelSel = document.getElementById("logLevel");
  const searchInp = document.getElementById("logSearch");
  const refreshBtn = document.getElementById("refreshLogsBtn");
  const clearBtn = document.getElementById("clearLogsBtn");

  if (!console_) return;

  function render() {
    const level = levelSel?.value || "";
    const query = (searchInp?.value || "").toLowerCase();
    const filtered = SAMPLE_LOGS.filter(
      (l) => (!level || l.level === level) && (!query || l.msg.toLowerCase().includes(query)),
    );

    console_.innerHTML =
      filtered.length === 0
        ? `<p class="log-empty">No log entries match your filter.</p>`
        : filtered
            .map(
              (l) => `
          <div class="log-line log-${l.level}">
            <span class="log-time">${l.time}</span>
            <span class="log-badge" style="background:${LOG_COLORS[l.level]}">${l.level.toUpperCase()}</span>
            <span class="log-msg">${l.msg}</span>
          </div>
        `,
            )
            .join("");
  }

  levelSel?.addEventListener("change", render);
  searchInp?.addEventListener("input", render);
  refreshBtn?.addEventListener("click", () => {
    render();
    toast("Logs refreshed.");
  });
  clearBtn?.addEventListener("click", () => {
    if (!confirm("Clear all displayed logs?")) return;
    console_.innerHTML = `<p class="log-empty">Logs cleared.</p>`;
  });

  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER STATUS
// ─────────────────────────────────────────────────────────────────────────────

const SERVER_SERVICES = [
  {
    name: "Web Server",
    icon: "fa-solid fa-globe",
    status: "online",
    uptime: "99.9%",
    latency: "12ms",
  },
  {
    name: "Database",
    icon: "fa-solid fa-database",
    status: "online",
    uptime: "99.8%",
    latency: "4ms",
  },
  {
    name: "Redis Cache",
    icon: "fa-solid fa-bolt",
    status: "online",
    uptime: "99.9%",
    latency: "1ms",
  },
  {
    name: "Email Service",
    icon: "fa-solid fa-envelope",
    status: "warning",
    uptime: "98.2%",
    latency: "320ms",
  },
  {
    name: "File Storage",
    icon: "fa-solid fa-hdd",
    status: "online",
    uptime: "100%",
    latency: "8ms",
  },
  {
    name: "Background Jobs",
    icon: "fa-solid fa-gears",
    status: "online",
    uptime: "99.5%",
    latency: "—",
  },
  {
    name: "SMS Gateway",
    icon: "fa-solid fa-comment-sms",
    status: "offline",
    uptime: "N/A",
    latency: "—",
  },
  {
    name: "Backup Service",
    icon: "fa-solid fa-cloud-arrow-up",
    status: "online",
    uptime: "99.7%",
    latency: "—",
  },
];

function initServerStatus() {
  const grid = document.getElementById("serverStatusGrid");
  const refreshBtn = document.getElementById("refreshStatusBtn");

  if (!grid) return;

  function render() {
    grid.innerHTML = SERVER_SERVICES.map(
      (s) => `
      <div class="status-card status-${s.status}">
        <div class="status-card-icon"><i class="${s.icon}"></i></div>
        <div class="status-card-info">
          <strong>${s.name}</strong>
          <p>Uptime: ${s.uptime} &nbsp;|&nbsp; Latency: ${s.latency}</p>
        </div>
        <div class="status-pill ${s.status}">${s.status.toUpperCase()}</div>
      </div>
    `,
    ).join("");
  }

  refreshBtn?.addEventListener("click", () => {
    render();
    toast("Status refreshed.");
  });
  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE MONITORING
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_VOLUMES = [
  { label: "Primary Disk", used: 68, total: 200, unit: "GB" },
  { label: "Backup Volume", used: 42, total: 500, unit: "GB" },
  { label: "Media Store", used: 11, total: 50, unit: "GB" },
];

function initStorage() {
  const overview = document.getElementById("storageOverview");
  const cleanTemp = document.getElementById("cleanTempBtn");
  const cleanLogs = document.getElementById("cleanLogsBtn");
  const cleanBack = document.getElementById("cleanBackupsBtn");

  if (!overview) return;

  overview.innerHTML = STORAGE_VOLUMES.map((v) => {
    const pct = Math.round((v.used / v.total) * 100);
    const color = pct >= 80 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#10b981";
    return `
      <div class="storage-vol">
        <div class="storage-vol-header">
          <strong>${v.label}</strong>
          <span>${v.used} / ${v.total} ${v.unit} (${pct}%)</span>
        </div>
        <div class="storage-bar-wrap">
          <div class="storage-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join("");

  cleanTemp?.addEventListener("click", () => toast("Temp files cleared — 1.2 GB freed."));
  cleanLogs?.addEventListener("click", () => toast("Old logs purged — 340 MB freed."));
  cleanBack?.addEventListener("click", () => {
    if (confirm("Delete backups older than 90 days?")) toast("Old backups deleted — 22 GB freed.");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────────────────────────────────────

function initApiKeys() {
  const generateBtn = document.getElementById("generateKeyBtn");
  const form = document.getElementById("generateKeyForm");
  const copyBtn = document.getElementById("copyNewKeyBtn");
  const display = document.getElementById("newKeyDisplay");
  const keyValue = document.getElementById("newKeyValue");

  if (!generateBtn) return;

  // Wire the copy-secret-key button inside the 2FA modal (reused here for API key copy)
  document.getElementById("copySecretKey")?.addEventListener("click", () => {
    navigator.clipboard?.writeText("ABCD-EFGH-IJKL-MNOP").then(() => toast("Key copied!"));
  });

  generateBtn.addEventListener("click", () => {
    form?.reset();
    if (display) display.style.display = "none";
    openModal("generateKeyModal");
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("keyName")?.value || "New Key";
    const fakeKey = `sk_live_${Math.random().toString(36).slice(2, 18).toUpperCase()}`;
    if (keyValue) keyValue.textContent = fakeKey;
    if (display) display.style.display = "block";
    toast(`API key "${name}" generated.`);
  });

  copyBtn?.addEventListener("click", () => {
    const key = keyValue?.textContent;
    if (key) navigator.clipboard?.writeText(key).then(() => toast("Key copied to clipboard."));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API RATE LIMITS
// ─────────────────────────────────────────────────────────────────────────────

function initApiRateLimits() {
  const saveBtn = document.getElementById("saveRateLimitsBtn");
  if (!saveBtn) return;
  saveBtn.addEventListener("click", () => toast("Rate limits saved."));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────

function initCompliance() {
  // All toggle state is handled natively by the checkbox inputs.
  // Wire save buttons for each sub-section.
  document.querySelectorAll(".tabPage#compliance .btn-primary").forEach((btn) => {
    btn.addEventListener("click", () => toast("Compliance settings saved."));
  });

  // Document upload placeholders
  document.querySelectorAll(".compliance-doc-item .btn-secondary:last-child").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf";
      input.click();
      input.addEventListener("change", () => {
        if (input.files[0]) toast(`${input.files[0].name} uploaded.`);
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared utility
// ─────────────────────────────────────────────────────────────────────────────

function simulateDownload(filename) {
  const a = document.createElement("a");
  a.href = "data:text/plain;charset=utf-8,Sample export data";
  a.download = filename;
  a.click();
  toast(`Download started: ${filename}`);
}
