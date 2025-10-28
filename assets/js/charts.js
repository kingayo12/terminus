let snapshotChartInstance = null; // store reference for cleanup

document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    const chartCanvas = document.querySelector("#content #snapshotChart");

    // Only run if chart exists and not already rendered
    if (chartCanvas && !snapshotChartInstance) {
      initSnapshotChart(chartCanvas);
    }

    // If user navigates away (chartCanvas removed), reset reference
    if (!chartCanvas && snapshotChartInstance) {
      snapshotChartInstance.destroy();
      snapshotChartInstance = null;
    }
  });

  observer.observe(document.querySelector("#content"), { childList: true, subtree: true });
});

function initSnapshotChart(canvas) {
  const ctx = canvas.getContext("2d");

  const styles = getComputedStyle(document.body);

  const textColor = styles.getPropertyValue("--text-color").trim();
  const primaryColor = styles.getPropertyValue("--primary-color").trim();
  const successColor = styles.getPropertyValue("--success-color").trim();
  const warningColor = styles.getPropertyValue("--warning-color").trim();
  const accentColor = styles.getPropertyValue("--accent-color").trim();

  snapshotChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Gate In", "Gate Out", "Avg Turnaround"],
      datasets: [
        {
          label: "Today",
          data: [48, 21, 14],
          backgroundColor: [primaryColor, successColor, warningColor],
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        x: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: accentColor,
          titleColor: "#fff",
          bodyColor: "#fff",
        },
      },
    },
  });
}
