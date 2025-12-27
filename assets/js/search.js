// // Search form logic
document.getElementById("searchForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent form from submitting normally

  const searchValue = document.getElementById("searchInput").value.trim().toUpperCase();

  // Clear previous highlights from all snap boxes
  document.querySelectorAll(".snap_box").forEach((snapBox) => {
    snapBox.classList.remove("highlight2");
  });

  // Check if the input is valid
  if (searchValue === "") {
    alert("Please enter a BL No, Container No, or TDO.");
    return;
  }

  // Variable to check if any matching container is found
  let found = false;

  // Loop through all containers to find the matching ones
  document.querySelectorAll(".container").forEach((container) => {
    const containerNo = container.querySelector(".cont_num").textContent.trim().toUpperCase();

    // If the container number matches the search value
    if (containerNo.includes(searchValue)) {
      // Add highlight to the snap_box that holds the container
      container.closest(".snap_box").classList.add("highlight2");
      found = true;
    }
  });

  if (!found) {
    alert("No containers found for the entered criteria.");
  }
});
