// assets/js/notifications.js
(function () {
  const sampleData = [
    {
      title: "Gate Delay Quay 3",
      type: "warning",
      recipients: "Clients",
      datetime: "2025-10-27T11:00",
      priority: "High",
      status: "Active",
      sentBy: "Operations",
    },
    {
      title: "System Maintenance",
      type: "info",
      recipients: "All Users",
      datetime: "2025-10-26T02:00",
      priority: "Normal",
      status: "Inactive",
      sentBy: "IT",
    },
  ];

  // Helper to format date/time nicely
  function formatDT(input) {
    try {
      const d = new Date(input);
      return d.toLocaleString();
    } catch {
      return input;
    }
  }

  // Render table rows
  function renderTable(data) {
    const tbody = document.querySelector("#notificationsTable tbody");
    const noRec = document.getElementById("noRecords");
    const count = document.getElementById("recordsCount");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      noRec.style.display = "block";
      count.textContent = "0 records";
      return;
    }
    noRec.style.display = "none";
    count.textContent = data.length + (data.length === 1 ? " record" : " records");

    data.forEach((r) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(r.title)}</td>
        <td style="text-transform:capitalize">${r.type}</td>
        <td>${escapeHtml(r.recipients)}</td>
        <td>${formatDT(r.datetime)}</td>
        <td style="text-transform:capitalize">${r.priority}</td>
        <td><span class="status-pill ${
          r.status === "Active" ? "status-active" : "status-inactive"
        }">${r.status}</span></td>
        <td>${escapeHtml(r.sentBy)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Simple escape
  function escapeHtml(str = "") {
    return String(str).replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]),
    );
  }

  // State
  let dataStore = [...sampleData];

  // Initialize when fragment is injected (works with includeHTML)
  function initNotifications() {
    if (!document.querySelector("#notificationForm")) return;

    // render initial
    renderTable(dataStore);

    // toggle logic
    const toggle = document.getElementById("statusToggle");
    const label = document.getElementById("statusLabel");
    if (toggle && !toggle._inited) {
      toggle._inited = true;
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("on");
        const isOn = toggle.classList.contains("on");
        label.textContent = isOn ? "Active" : "Inactive";
        toggle.setAttribute("aria-checked", isOn ? "true" : "false");
      });
      toggle.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle.click();
        }
      });
    }

    // form handlers
    const saveBtn = document.getElementById("saveBtn");
    const clearBtn = document.getElementById("clearBtn");
    const searchBtn = document.getElementById("searchBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const searchInput = document.getElementById("searchInput");

    saveBtn.addEventListener("click", () => {
      const newItem = {
        title: document.getElementById("title").value.trim(),
        type: document.getElementById("type").value,
        recipients: document.getElementById("recipient").value,
        datetime: document.getElementById("datetime").value || new Date().toISOString(),
        priority: document.getElementById("priority").value,
        status: document.getElementById("statusToggle").classList.contains("on")
          ? "Active"
          : "Inactive",
        sentBy: document.getElementById("sentby").value.trim() || "System",
      };

      if (!newItem.title) {
        flashError("Please enter a notification title.");
        return;
      }

      // prepend to store
      dataStore.unshift(newItem);
      renderTable(dataStore);
      flashSuccess("Notification saved.");
      // optional: clear form
      // clearForm();
    });

    clearBtn.addEventListener("click", () => {
      clearForm();
    });

    searchBtn.addEventListener("click", () => {
      const q = (searchInput.value || "").toLowerCase().trim();
      if (!q) {
        renderTable(dataStore);
        return;
      }
      const results = dataStore.filter(
        (r) =>
          r.title.toLowerCase().includes(q) || (r.message && r.message.toLowerCase().includes(q)),
      );
      renderTable(results);
    });

    refreshBtn.addEventListener("click", () => {
      dataStore = [...sampleData];
      renderTable(dataStore);
      flashSuccess("Records refreshed.");
    });

    // helper functions
    function clearForm() {
      document.getElementById("title").value = "";
      document.getElementById("message").value = "";
      document.getElementById("datetime").value = "";
      document.getElementById("sentby").value = "";
      document.getElementById("priority").value = "normal";
      document.getElementById("recipient").value = "all";
      const t = document.getElementById("statusToggle");
      t.classList.remove("on");
      document.getElementById("statusLabel").textContent = "Inactive";
    }

    // small flash messages
    function flashError(msg) {
      showTempMsg(msg, true);
    }
    function flashSuccess(msg) {
      showTempMsg(msg, false);
    }
    function showTempMsg(msg, isError) {
      let el = document.getElementById("notif_temp");
      if (!el) {
        el = document.createElement("div");
        el.id = "notif_temp";
        el.style.position = "fixed";
        el.style.right = "18px";
        el.style.bottom = "18px";
        el.style.padding = "12px 14px";
        el.style.borderRadius = "8px";
        el.style.zIndex = 9999;
        el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.background = isError ? "rgba(231,76,60,0.95)" : "rgba(16,185,129,0.95)";
      el.style.color = "#fff";
      el.style.opacity = "1";
      setTimeout(() => {
        el.style.opacity = "0";
      }, 2200);
    }
  }

  // Use MutationObserver to auto-init when this fragment is injected
  function observeContent() {
    const target = document.getElementById("content") || document.body;
    const mo = new MutationObserver(() => {
      // if our page is present, init
      if (
        document.querySelector(".notifications_card") ||
        document.getElementById("notificationForm")
      ) {
        initNotifications();
      }
    });
    mo.observe(target, { childList: true, subtree: true });

    // also try immediate init if already present
    if (
      document.querySelector(".notifications_card") ||
      document.getElementById("notificationForm")
    ) {
      initNotifications();
    }
  }

  // start observing once DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeContent);
  } else {
    observeContent();
  }
})();
