/**
 * charts.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Initialises Chart.js canvases and keeps their colours in sync with the
 * active application theme.
 *
 * HOW THEME COLOURS WORK
 * ──────────────────────
 * Each theme class on <body> (e.g. "emerald", "purple-royale") defines a set
 * of CSS custom properties:
 *
 *   --chart-color-1  through  --chart-color-6   (opaque accent colours)
 *   --chart-grid                                (gridline colour)
 *   --chart-text                                (tick / legend colour)
 *
 * This file reads those variables at render time via getComputedStyle so
 * charts always use the correct palette without any JS-side theme mapping.
 *
 * If a variable is not defined for a theme, it falls back to a neutral
 * default palette so charts never break.
 *
 * Canvas data-attributes:
 *   data-type        bar | line | polarArea | doughnut | pie
 *   data-labels      JSON array  e.g. '["Mon","Tue","Wed"]'
 *   data-data        JSON array  (single-dataset charts)
 *   data-datasets    JSON array of dataset objects (multi-dataset charts)
 *   data-label       Legend label for single-dataset charts
 *
 * This is a plain IIFE (not an ES module) so it loads as a normal
 * <script defer> and accesses Chart.js from the global scope.
 */

(function () {
  "use strict";

  // ── Active chart registry ────────────────────────────────────────────────
  /** @type {Chart[]} */
  var activeCharts = [];

  // ── Colour resolution ────────────────────────────────────────────────────

  /**
   * Fallback palette used when CSS variables are not defined.
   * Values are intentionally neutral so they work on any background.
   */
  var FALLBACK_COLORS = [
    "rgba(99,  149, 222, 0.85)",
    "rgba(235, 100, 120, 0.85)",
    "rgba(72,  199, 172, 0.85)",
    "rgba(250, 196,  80, 0.85)",
    "rgba(162, 112, 224, 0.85)",
    "rgba(253, 142,  65, 0.85)",
  ];

  /**
   * Reads --chart-color-N (1-indexed) from the computed style of <body>.
   * Falls back to FALLBACK_COLORS[index] if the variable is empty.
   * @param {number} index  0-based index
   * @returns {string}      A valid CSS colour string
   */
  function themeColor(index) {
    var prop = "--chart-color-" + (index + 1);
    var value = getComputedStyle(document.body).getPropertyValue(prop).trim();
    return value || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  }

  /**
   * Returns the current theme's gridline colour (defaults to light grey).
   * @returns {string}
   */
  function gridColor() {
    var value = getComputedStyle(document.body).getPropertyValue("--chart-grid").trim();
    return value || "rgba(0,0,0,0.08)";
  }

  /**
   * Returns the current theme's text colour for ticks and legends.
   * @returns {string}
   */
  function textColor() {
    var value = getComputedStyle(document.body).getPropertyValue("--chart-text").trim();
    return value || "#555";
  }

  // ── JSON helper ──────────────────────────────────────────────────────────

  function parseJSON(str, fallback) {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch (_) {
      return fallback;
    }
  }

  // ── Config builder ───────────────────────────────────────────────────────

  /**
   * Builds a Chart.js config object from a canvas element's data attributes,
   * pulling colours live from the active theme's CSS variables.
   * @param {HTMLCanvasElement} canvas
   * @returns {object|null}
   */
  function buildConfig(canvas) {
    var type = canvas.dataset.type || "bar";
    var labels = parseJSON(canvas.dataset.labels, []);
    var data = parseJSON(canvas.dataset.data, null);
    var datasets = parseJSON(canvas.dataset.datasets, null);
    var label = canvas.dataset.label || "";

    var chartDatasets;

    if (datasets) {
      // ── Multi-dataset (line chart, grouped bar, etc.) ──────────────────
      chartDatasets = datasets.map(function (ds, i) {
        var color = themeColor(i);
        return Object.assign(
          {
            backgroundColor: color,
            borderColor: color,
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          ds,
        );
      });
    } else if (data) {
      // ── Single-dataset (bar, polarArea, doughnut, pie) ─────────────────
      var bgColors = data.map(function (_, i) {
        return themeColor(i);
      });
      var borderColors = data.map(function (_, i) {
        return themeColor(i);
      });

      chartDatasets = [
        {
          label: label,
          data: data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ];
    } else {
      return null;
    }

    var gc = gridColor();
    var tc = textColor();

    return {
      type: type,
      data: {
        labels: labels,
        datasets: chartDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 500, easing: "easeInOutQuart" },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: tc,
              boxWidth: 14,
              padding: 16,
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.75)",
            titleColor: "#fff",
            bodyColor: "#ddd",
            cornerRadius: 6,
          },
        },
        scales: buildScales(type, gc, tc),
      },
    };
  }

  /**
   * Returns scale config appropriate for the chart type.
   * Polar / doughnut / pie charts have no cartesian axes.
   * @param {string} type
   * @param {string} gc   gridline colour
   * @param {string} tc   text colour
   * @returns {object}
   */
  function buildScales(type, gc, tc) {
    var noAxes = ["polarArea", "doughnut", "pie", "radar"];
    if (noAxes.indexOf(type) !== -1) return {};

    var axisBase = {
      ticks: {
        color: tc,
        font: { size: 11 },
      },
      grid: {
        color: gc,
        drawBorder: false,
      },
    };

    return { x: axisBase, y: axisBase };
  }

  // ── Chart factory ────────────────────────────────────────────────────────

  /**
   * Safely creates a Chart.js instance, destroying any prior instance on the
   * same canvas first to avoid the "Canvas is already in use" error.
   * @param {HTMLCanvasElement} canvas
   * @param {object}            config
   * @returns {Chart}
   */
  function createChart(canvas, config) {
    var existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    var instance = new Chart(canvas, config);
    activeCharts.push(instance);
    return instance;
  }

  // ── Destroy all tracked instances ────────────────────────────────────────

  function destroyAll() {
    if (!Array.isArray(activeCharts)) {
      activeCharts = [];
      return;
    }
    activeCharts.forEach(function (c) {
      try {
        c.destroy();
      } catch (_) {
        /* already destroyed */
      }
    });
    activeCharts = [];
  }

  // ── Main init ────────────────────────────────────────────────────────────

  function initCharts() {
    document.querySelectorAll("canvas.chart").forEach(function (canvas) {
      var config = buildConfig(canvas);
      if (config) createChart(canvas, config);
    });
  }

  // ── Theme-change listener ────────────────────────────────────────────────
  // theme.js dispatches "theme-changed" on document after applying the new
  // body class. At that point the CSS variables are already updated, so
  // reading them in buildConfig() gives the correct new colours.

  document.addEventListener("theme-changed", function () {
    destroyAll();
    initCharts();
  });

  // ── dark-mode listener ───────────────────────────────────────────────────
  // Dark mode also changes --chart-grid and --chart-text, so re-render.

  document.addEventListener("darkmode-changed", function () {
    destroyAll();
    initCharts();
  });

  // ── Content-area mutation observer ───────────────────────────────────────
  // Fires when includeHTML() replaces the #content div with a new page.
  // subtree:false means it only reacts to direct child changes (the page
  // swap), not to every inner DOM mutation, keeping it cheap.

  function observeContent() {
    var el = document.getElementById("content") || document.body;
    new MutationObserver(function () {
      destroyAll();
      // Small timeout lets the new DOM settle before querying canvases
      setTimeout(initCharts, 50);
    }).observe(el, { childList: true, subtree: false });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      observeContent();
      initCharts();
    });
  } else {
    observeContent();
    initCharts();
  }
})();
