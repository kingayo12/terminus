# JS Module Architecture

## Directory layout

```
js/
├── main.js                  ← App entry point (replaces load.js)
├── utils/
│   └── dom.js               ← Shared helpers: includeHTML, getInitials, showToast
└── modules/
    ├── theme.js             ← Colour themes + dark-mode toggle
    ├── fontSize.js          ← Font-size scaling via CSS variables
    ├── sidebar.js           ← Sidebar navigation & page loading
    ├── userProfile.js       ← User initials, profile completion ring, settings edit
    ├── dataTables.js        ← jQuery DataTables initialisation & row actions
    ├── preferences.js       ← Dashboard widget visibility modal
    ├── dashboard.js         ← Metric cards + breakdown detail modal
    ├── changePassword.js    ← Change-password modal with live validation
    ├── security.js          ← 2FA modal, screen lock, anti-inspect
    └── yardManagement.js    ← Yard grid, drag-and-drop, truck loading, search
```

## How to wire it up in HTML

```html
<!-- In your index.html -->
<script type="module" src="./assets/js/main.js"></script>
```

`type="module"` is required for ES module `import/export` to work.
No bundler needed for local/dev use; use Vite/Rollup/esbuild for production.

---

## Adding a new page

1. Create `js/modules/myPage.js` and export an `initMyPage` function.
2. Import it in `main.js`.
3. Add `initMyPage` to the `PAGE_CALLBACKS` array.

The function will be called after every page load. Guard against missing
DOM elements at the top of the function so it exits silently on unrelated pages:

```js
export function initMyPage() {
  const el = document.getElementById("my-element");
  if (!el) return; // ← safe exit
  // ...
}
```

---

## Adding a new action button to DataTables

Open `modules/dataTables.js` and add one entry to each of the two objects:

```js
// 1. HTML template
const ACTION_TEMPLATES = {
  approve: `<button class="action-btn approve" title="Approve">
              <i class="fa fa-check"></i>
            </button>`,
};

// 2. Click handler
const ACTION_HANDLERS = {
  approve: (data) => alert(`Approving: ${data[1]}`),
};
```

Then add `approve` to the table's `data-actions` attribute:

```html
<table data-datatable="true" data-actions="edit,delete,approve">
```

---

## Adding a new breakdown metric to the Dashboard

Open `modules/dashboard.js` and add a key to `BREAKDOWN_DATA`:

```js
const BREAKDOWN_DATA = {
  myNewMetric: {
    columns: ["Col A", "Col B"],
    rows:    [["val1", "val2"]],
  },
};
```

Make sure your card's `data-pref` attribute matches the key:

```html
<article class="card" data-pref="myNewMetric" data-pref-label="My Metric">
```

---

## Key design principles

| Principle | How it's applied |
|-----------|-----------------|
| **Single Responsibility** | One module = one concern |
| **Fail-safe guards** | Every init checks for required DOM nodes before touching them |
| **No globals (except where necessary)** | `window.*` assignments are limited to functions that must be reachable from inline HTML attributes |
| **Data-driven config** | Action buttons, font sizes, password rules, and breakdown tables are all config objects — extend them without touching logic |
| **Idempotent inits** | `data-bound` / DataTables `.isDataTable()` guards prevent double-binding on repeated loads |
