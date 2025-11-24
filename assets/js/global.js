// -------------------- INCLUDE HTML --------------------
function includeHTML(id, file, callback) {
  fetch(file)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return response.text();
    })
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback(); // run callback after load
    })
    .catch((err) => {
      console.error(err);
      document.getElementById(id).innerHTML = `<p style="color:red;">Error loading ${file}</p>`;
    });
}

// -------------------- INITIAL PAGE LOAD --------------------
includeHTML("sidebar", "./components/sidebar.html", initSidebarMenu);
includeHTML("header", "./components/header.html");

// Load default page
includeHTML("content", "./pages/dashboard.html", initDashboardPage);
