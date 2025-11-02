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

          $(document).ready(function () {
            const table = $(".records_table").DataTable({
              dom: "Bfrtip",
              buttons: [
                { extend: "copy", className: "btn btn-dark" },
                { extend: "csv", className: "btn btn-primary" },
                { extend: "excel", className: "btn btn-success" },
                { extend: "pdf", className: "btn btn-danger" },
                { extend: "print", className: "btn btn-info" },
                { extend: "colvis", className: "btn btn-secondary" },
              ],
              pageLength: 5,
              responsive: true,
            });

            // 📝 Handle Edit
            $(".records_table").on("click", ".action-btn.edit", function () {
              const row = $(this).closest("tr");
              const data = table.row(row).data();
              alert(`Editing ${data[0]} (${data[1]})`);
              // You can auto-fill your form fields here with the data values
            });

            // 🗑️ Handle Delete
            $(".records_table").on("click", ".action-btn.delete", function () {
              const row = $(this).closest("tr");
              const data = table.row(row).data();
              if (confirm(`Are you sure you want to delete ${data[0]}?`)) {
                table.row(row).remove().draw();
              }
            });
          });
        });
      }
    });
  });
}
