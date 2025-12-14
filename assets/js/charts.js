/********************************************************************
 *  UNIVERSAL CHART MANAGER
 *  - Auto-detects charts in DOM
 *  - Supports ANY Chart.js type
 *  - Unlimited datasets
 *  - Theme-aware (uses CSS vars)
 *  - Reusable everywhere
 ********************************************************************/

const ChartManager = {
  charts: new WeakMap(),

  initObserver() {
    const target = document.body;
    if (!target) return;

    const observer = new MutationObserver(() => {
      this.scanForCharts();
      this.cleanup();
    });

    observer.observe(target, { childList: true, subtree: true });

    this.scanForCharts();
  },

  scanForCharts() {
    document.querySelectorAll(".chart").forEach((canvas) => {
      if (!this.charts[canvas]) this.createChart(canvas);
    });
  },

  // cleanup() {
  //   for (const canvas in this.charts) {
  //     const el = this.charts[canvas].canvas;
  //     if (!document.body.contains(el)) {
  //       this.charts[canvas].destroy();
  //       delete this.charts[canvas];
  //     }
  //   }
  // },

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
      text: styles.getPropertyValue("--light-text").trim(),
      primary: styles.getPropertyValue("--primary-color").trim(),
      success: styles.getPropertyValue("--success-color").trim(),
      warning: styles.getPropertyValue("--warning-color").trim(),
      accent: styles.getPropertyValue("--accent-color").trim(),
      borderl: styles.getPropertyValue("--border-color").trim(),
    };

    // Read attributes
    const type = canvas.dataset.type || "bar";
    const labels = JSON.parse(canvas.dataset.labels || "[]");

    let datasets = [];

    if (canvas.dataset.datasets) {
      // Parse user datasets
      datasets = JSON.parse(canvas.dataset.datasets);

      // Auto-apply theme colors if not provided
      datasets = datasets.map((ds, index) => {
        // If dataset has NO backgroundColor, apply automatic theme colors
        if (!ds.backgroundColor) {
          const themeColors = [theme.primary, theme.success, theme.warning];
          ds.backgroundColor = themeColors[index % themeColors.length];
        }

        // If dataset has NO borderColor, use same color
        if (!ds.borderColor) {
          ds.borderColor = ds.backgroundColor;
        }

        // Optional defaults
        ds.borderWidth ??= 1;
        ds.tension ??= 0.3;
        ds.borderRadius ??= 6;

        return ds;
      });
    } else {
      // Fallback single dataset mode
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
      layout: {
        padding: {
          top: 5,
          bottom: 25,
        },
      },

      // Only bar/line need axes
      scales: ["bar", "line"].includes(type)
        ? {
            y: {
              beginAtZero: true,
              ticks: { color: theme.accent },
              grid: { color: theme.borderl },
            },
            x: {
              ticks: { color: theme.test },
              grid: { display: false },
            },
          }
        : {},

      plugins: {
        legend: { display: true },
        datalabels: {
          // <-- NEW
          color: theme.text, // text color of the numbers
          anchor: "end", // position relative to the bar/point
          align: "end",
          font: { weight: "bold", size: 10 },
        },
        tooltip: {
          backgroundColor: theme.accent,
          titleColor: theme.text,
          bodyColor: "#fff",
        },
      },
    };

    const chart = new Chart(ctx, { type, data: { labels, datasets }, options });

    this.charts.set(canvas, chart);
  },
};

// Auto-run
document.addEventListener("DOMContentLoaded", () => ChartManager.initObserver());
