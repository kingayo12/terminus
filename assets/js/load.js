// Function to load HTML into a container
function includeHTML(id, file, callback) {
  fetch(file)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return response.text();
    })
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback(); // ✅ Run callback after loading
    })
    .catch((err) => {
      console.error(err);
      document.getElementById(id).innerHTML = `<p style="color:red;">Error loading ${file}</p>`;
    });
}

// Include files
includeHTML("sidebar", "./components/sidebar.html", initSidebarMenu); // ✅ Run active toggle after sidebar loads
includeHTML("header", "./components/header.html");
includeHTML("content", "../content.html");
includeHTML("cards", "../cards.html");
includeHTML("content", "./pages/dashboard.html"); // default view

// -------------------- Sidebar Active + Page Loader -----------------------
function initSidebarMenu() {
  const menuItems = document.querySelectorAll(".sidebar .menu_item");

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active state from all
      menuItems.forEach((el) => el.classList.remove("active"));
      item.classList.add("active");

      // Get the data-target attribute (page name)
      const target = item.getAttribute("data-target");
      if (target) {
        // Define file path for each menu section
        const pageFile = `../pages/${target}.html`;

        // Load the page into #content
        includeHTML("content", pageFile, () => {
          console.log(`✅ Loaded ${target}.html`);
        });
      }
    });
  });
}
