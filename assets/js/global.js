const ChartManager = {
  charts: new WeakMap(), // Use WeakMap to store chart instances per canvas

  initObserver() {
    const target = document.body; // observe the whole body
    if (!target) return;

    const observer = new MutationObserver(() => {
      this.scanForCharts();
      this.cleanup();
    });

    observer.observe(target, { childList: true, subtree: true });

    // Initial scan
    this.scanForCharts();
  },

  scanForCharts() {
    document.querySelectorAll(".chart").forEach((canvas) => {
      if (!this.charts.has(canvas)) this.createChart(canvas);
    });
  },

  cleanup() {
    this.charts.forEach((chart, canvas) => {
      if (!document.body.contains(canvas)) {
        chart.destroy();
        this.charts.delete(canvas);
      }
    });
  },

  createChart(canvas) {
    const ctx = canvas.getContext("2d");
    const styles = getComputedStyle(document.body);

    const theme = {
      text: styles.getPropertyValue("--text-color").trim(),
      primary: styles.getPropertyValue("--primary-color").trim(),
      success: styles.getPropertyValue("--success-color").trim(),
      warning: styles.getPropertyValue("--warning-color").trim(),
      accent: styles.getPropertyValue("--accent-color").trim(),
    };

    const type = canvas.dataset.type || "bar";
    const labels = JSON.parse(canvas.dataset.labels || "[]");

    let datasets = [];

    if (canvas.dataset.datasets) {
      datasets = JSON.parse(canvas.dataset.datasets).map((ds, index) => {
        if (!ds.backgroundColor)
          ds.backgroundColor = [theme.primary, theme.success, theme.warning][index % 3];
        if (!ds.borderColor) ds.borderColor = ds.backgroundColor;
        ds.borderWidth ??= 1;
        ds.tension ??= 0.3;
        ds.borderRadius ??= 6;
        return ds;
      });
    } else {
      datasets = [
        {
          label: canvas.dataset.label || "Dataset",
          data: JSON.parse(canvas.dataset.data || "[]"),
          backgroundColor: JSON.parse(
            canvas.dataset.colors || `["${theme.primary}","${theme.success}","${theme.warning}"]`,
          ),
          borderColor: JSON.parse(
            canvas.dataset.colors || `["${theme.primary}","${theme.success}","${theme.warning}"]`,
          ),
          borderWidth: 1,
          tension: 0.3,
          borderRadius: 6,
        },
      ];
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: ["bar", "line"].includes(type)
        ? {
            y: {
              beginAtZero: true,
              ticks: { color: theme.text },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
            x: { ticks: { color: theme.text }, grid: { display: false } },
          }
        : {},
      plugins: {
        legend: { display: true },
        tooltip: { backgroundColor: theme.accent, titleColor: "#fff", bodyColor: "#fff" },
      },
    };

    const chart = new Chart(ctx, { type, data: { labels, datasets }, options });

    this.charts.set(canvas, chart); // store in WeakMap
  },
};

document.addEventListener("DOMContentLoaded", () => ChartManager.initObserver());
