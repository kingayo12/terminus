// Fetch the container data from data.json and populate the yard
document.addEventListener("DOMContentLoaded", () => {
  fetch("./data.json")
    .then((response) => response.json())
    .then((data) => {
      populateContainers(data.containers);
      initializeDragAndDrop();
      initializeSnapBoxCounts();
    })
    .catch((error) => console.error("Error loading containers:", error));
});

function populateContainers(containers) {
  const yard = document.getElementById("yard");
  const yardRows = ["A", "B", "C", "D", "E", "F", "G"]; // Define the rows in the yard

  yardRows.forEach((row) => {
    // Create container row dynamically
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("containers_list");
    const rowLabel = document.createElement("h1");
    rowLabel.textContent = row;
    rowDiv.appendChild(rowLabel);

    // Create snap boxes within each row
    for (let i = 1; i <= 6; i++) {
      const snapBox = document.createElement("div");
      snapBox.classList.add("snap_box");
      snapBox.setAttribute("data-capacity", 5);
      snapBox.setAttribute("data-location", `${row}${i}`);
      snapBox.innerHTML = `<span class="count"></span>`;

      // Check if any containers belong in this snap box
      const matchingContainers = containers.filter(
        (container) => container.location === `${row}${i}`,
      );

      matchingContainers.forEach((matchingContainer) => {
        const containerDiv = document.createElement("div");

        // Add classes based on container size and shipping line
        containerDiv.classList.add(
          "container",
          matchingContainer.size === "20ft" ? "twenty" : "fortyfive",
          matchingContainer.shippingLine, // Add shipping line as a class
        );
        containerDiv.setAttribute("draggable", "true");
        containerDiv.setAttribute("data-type", matchingContainer.size);
        containerDiv.innerHTML = `
                          <div class="cont_num">${matchingContainer.containerNumber}</div>
                          ${matchingContainer.size}
                      `;
        snapBox.appendChild(containerDiv);
      });

      rowDiv.appendChild(snapBox);
    }

    yard.appendChild(rowDiv);
  });
}

function initializeSnapBoxCounts() {
  const snapBoxes = document.querySelectorAll(".snap_box");

  snapBoxes.forEach((snapBox, index) => {
    const containers = snapBox.querySelectorAll(".container");
    let totalContainerCount = 0;

    containers.forEach((container) => {
      const containerSize = container.getAttribute("data-type");
      const nextSnapBox = snapBoxes[index + 1]; // Get the next snap box if it exists
      if (containerSize === "40ft" || containerSize === "45ft") {
        totalContainerCount += 1;
        if (nextSnapBox) {
          const nextContainerCount = nextSnapBox.querySelectorAll(".container").length;
          updateCountDisplay(
            nextSnapBox,
            nextContainerCount + 1,
            nextSnapBox.getAttribute("data-capacity"),
          );
          nextSnapBox.classList.add("occupied");
        }
      }
    });
  });
  function updateCountDisplay(snapBox, currentCount, maxCapacity) {
    const countElem = snapBox.querySelector(".count");
    if (countElem) {
      countElem.innerHTML = `${currentCount} <sub>${maxCapacity - currentCount}</sub>`;
    }
  }
}

function initializeDragAndDrop() {
  // Now that containers and snap boxes are in the DOM, initialize them
  let containers = document.querySelectorAll(".container");
  let snapBoxes = document.querySelectorAll(".snap_box");
  let loadTruck = document.querySelector(".loadtruck");
  const errorMsg = document.querySelector(".er_message");
  let draggedContainer = null;

  // Assign unique IDs to containers based on type and index
  containers.forEach((container, index) => {
    container.id = container.getAttribute("data-type") + "-" + index;
  });

  // Add event listeners for dragstart and dragend
  containers.forEach((container) => {
    container.addEventListener("dragstart", dragStart);
    container.addEventListener("dragend", dragEnd);
  });

  // Add event listeners to snap boxes
  snapBoxes.forEach((snapBox) => {
    snapBox.addEventListener("dragover", dragOverSnapBox);
    snapBox.addEventListener("drop", dropInSnapBox);
  });

  // Initialize snap boxes with container count
  snapBoxes.forEach((box) => {
    const existingContainers = box.querySelectorAll(".container");
    initializeSnapBox(box, existingContainers.length);
  });

  // ----------------------------Function to Initialize Snap Box
  function initializeSnapBox(box, containerCount) {
    const countSpan = box.querySelector(".count");
    const maxCapacity = box.getAttribute("data-capacity");
    countSpan.innerHTML = `${containerCount} <sub>${maxCapacity - containerCount}</sub>`;

    if (containerCount > 0) {
      box.classList.add("occupied");
    }
  }

  // ----------------------------Drag Start and Drag End
  function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
    draggedContainer = e.target;
    e.target.classList.add("dragging");
    clearHighlights();
  }

  function dragEnd(e) {
    e.target.classList.remove("dragging");
    clearHighlights();
    draggedContainer = null;
  }

  // Clear highlights and visual indicators
  function clearHighlights() {
    snapBoxes.forEach((box) => {
      box.classList.remove("highlight", "invalid", "occupied");
      box.style.borderColor = "";
    });
  }

  // ------------------------------------Dragging Logic Updates
  function dragOverSnapBox(e) {
    e.preventDefault();
    const draggingElement = document.querySelector(".dragging");
    const box = e.target.closest(".snap_box");
    clearHighlights();
    highlightValidDropAreas(draggingElement, box);
  }

  // Highlight valid drop areas based on container type and snap box availability
  function highlightValidDropAreas(draggingElement, startBox) {
    const containerType = draggingElement.getAttribute("data-type");
    const startIndex = [...snapBoxes].indexOf(startBox);
    const neededBoxes = containerType === "20ft" ? 1 : 2;

    // Highlight valid areas
    for (let i = 0; i < neededBoxes; i++) {
      const box = snapBoxes[startIndex + i];
      if (box) {
        if (isValidDrop(box, draggingElement)) {
          box.classList.add("highlight");
        } else {
          box.classList.add("invalid");
          break;
        }
      }
    }
  }

  // -------------------------------------------------Dropping into a Snap Box
  function dropInSnapBox(e) {
    e.preventDefault();
    const box = e.target.closest(".snap_box");
    const id = e.dataTransfer.getData("text/plain");
    const draggingElement = document.getElementById(id);

    if (isValidDrop(box, draggingElement)) {
      removeFromCurrentParent(draggingElement);
      placeInSnapBox(box, draggingElement);
    } else {
      // showError("Invalid drop area!");
    }
  }

  // ------------------Checking for Valid Drop
  function isValidDrop(box, draggingElement) {
    const containerType = draggingElement.getAttribute("data-type");
    const startBoxIndex = [...snapBoxes].indexOf(box);
    const neededBoxes = containerType === "20ft" ? 1 : 2; // 40ft needs 2 snap boxes

    // Check if we have enough snap boxes for the container type
    for (let i = 0; i < neededBoxes; i++) {
      const currentBox = snapBoxes[startBoxIndex + i];
      if (!currentBox) {
        return false; // Not enough space
      }
    }

    if (containerType === "40ft" || containerType === "45ft") {
      // Check that both snap boxes have the same stack level
      const firstBox = snapBoxes[startBoxIndex];
      const secondBox = snapBoxes[startBoxIndex + 1];
      const firstBoxCount = firstBox.querySelectorAll(".container").length;
      const secondBoxCount = secondBox.querySelectorAll(".container").length;

      if (firstBoxCount !== secondBoxCount) {
        showError("Ensure stack level must be equal to drop a 40ft or 45ft container.");
        return false; // Stack levels are not equal, invalid drop
      }

      // Check if the drop is in the last row and prevent drop
      const lastRow = ["E6", "D6", "C6", "B6", "A6"].includes(box.getAttribute("data-location"));
      if (lastRow) {
        showError("Cannot drop a large container in this space!");
        return false; // Restrict dropping large containers on the last row
      }
    }

    // Ensure the container can be placed in all necessary snap boxes
    for (let i = 0; i < neededBoxes; i++) {
      const currentBox = snapBoxes[startBoxIndex + i];
      const currentContainerCount = currentBox.querySelectorAll(".container").length;
      const maxCapacity = currentBox.getAttribute("data-capacity");

      if (currentContainerCount >= maxCapacity) {
        showError("Stack Level Allowed Reached" + " " + "Allowed Stack is" + " " + maxCapacity);
        return false; // Exceeds capacity
      }
    }

    return true; // Valid drop if all checks pass
  }

  // ------------------------------------------Placing in Snap Box
  function placeInSnapBox(box, draggingElement) {
    const containerType = draggingElement.getAttribute("data-type");
    const startBoxIndex = [...snapBoxes].indexOf(box);
    const neededBoxes = containerType === "20ft" ? 1 : 2;

    for (let i = 0; i < neededBoxes; i++) {
      const currentBox = snapBoxes[startBoxIndex + i];
      const maxCapacity = currentBox.getAttribute("data-capacity");
      const currentContainerCount = currentBox.querySelectorAll(".container").length;

      if (currentContainerCount < maxCapacity) {
        if (i === 0 && !currentBox.contains(draggingElement)) {
          currentBox.appendChild(draggingElement);
          draggingElement.style.zIndex = 999 + currentContainerCount;
        }

        updateCountDisplay(currentBox, currentContainerCount + 1, maxCapacity);
        currentBox.classList.add("occupied");
      } else {
        showError("Max stack limit reached for this snap box.");
        return;
      }
    }
  }

  // ------------------------------Update Count Display for Two Snap Boxes
  function updateCountDisplay(box, currentCount, maxAllowed) {
    const countSpan = box.querySelector(".count");
    countSpan.innerHTML = `${currentCount} <sub>${maxAllowed - currentCount}</sub>`;
  }

  // ------------------------------Removing from Current Parent
  function removeFromCurrentParent(container) {
    const parentBox = container.parentElement;
    if (parentBox && parentBox.classList.contains("snap_box")) {
      parentBox.removeChild(container);
      const currentContainerCount = parentBox.querySelectorAll(".container").length;
      updateCountDisplay(parentBox, currentContainerCount, parentBox.getAttribute("data-capacity"));

      if (currentContainerCount === 0) {
        parentBox.classList.remove("occupied");
      }
    }
  }

  // Check if the truck can accept more containers
  function canDropInTruck(container) {
    const existingContainers = loadTruck.children;
    const containerType = container.getAttribute("data-type");

    // Debugging logs
    console.log("Truck contains:", existingContainers.length, "containers");
    console.log("Trying to drop:", containerType);

    const hasLargeContainer = Array.from(existingContainers).some((existingContainer) =>
      ["40ft", "45ft"].includes(existingContainer.getAttribute("data-type")),
    );

    if (hasLargeContainer) {
      console.log("Truck already has a large container");
      return false;
    }

    if (["40ft", "45ft"].includes(containerType)) {
      return existingContainers.length === 0; // Allow large container only if truck is empty
    }

    if (containerType === "20ft") {
      return existingContainers.length < 2; // Allow two 20ft containers
    }

    return false; // Default fallback
  }

  // Check if the truck is full
  function checkTruckCapacity() {
    const existingContainers = loadTruck.children;
    if (
      existingContainers.length >= 2 ||
      (existingContainers.length === 1 &&
        ["40ft", "45ft"].includes(existingContainers[0].getAttribute("data-type")))
    ) {
      loadTruck.classList.add("full");
    } else {
      loadTruck.classList.remove("full");
    }
  }

  loadTruck.addEventListener("dragover", (e) => {
    e.preventDefault();
    loadTruck.classList.add("highlight");
  });

  loadTruck.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const draggableElement = document.getElementById(id);

    if (canDropInTruck(draggableElement)) {
      removeFromCurrentParent(draggableElement);
      loadTruck.appendChild(draggableElement);
      checkTruckCapacity();
      enableDoubleClickToMove(draggableElement); // Enable future move out of truck
    } else {
      showError("Truck capacity reached or incompatible container size!");
    }

    loadTruck.classList.remove("highlight");
  });

  // -----------------------------------------------Dropping into the Free Area
  freeArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    freeArea.classList.add("highlight");
  });

  freeArea.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const draggableElement = document.getElementById(id);
    removeFromCurrentParent(draggableElement); // Remove from previous snap box or truck
    freeArea.appendChild(draggableElement);
    freeArea.classList.remove("highlight");
    freeArea.style.borderColor = "transparent";
  });

  // Handle leaving the drop zone
  freeArea.addEventListener("dragleave", () => {
    freeArea.classList.remove("highlight");
    freeArea.style.borderColor = "transparent";
  });

  function enableDoubleClickToMove(container) {
    container.addEventListener("dblclick", () => {
      const rect = container.getBoundingClientRect();
      const freeAreaRect = freeArea.getBoundingClientRect();
      const x = Math.random() * (freeAreaRect.width - container.clientWidth);
      const y = Math.random() * (freeAreaRect.height - container.clientHeight);

      const clone = container.cloneNode(true);
      document.body.appendChild(clone);
      clone.style.position = "absolute";
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${container.clientWidth}px`;
      clone.style.height = `${container.clientHeight}px`;
      clone.style.zIndex = 1000;
      clone.style.transition = "all 0.5s ease";

      requestAnimationFrame(() => {
        clone.style.left = `${freeAreaRect.left + x}px`;
        clone.style.top = `${freeAreaRect.top + y}px`;
      });

      setTimeout(() => {
        clone.remove();
        loadTruck.removeChild(container);
        freeArea.appendChild(container);
        container.classList.add("in-free-area");
      }, 500);
    });
  }

  let errorTimeout = null;

  function showError(message) {
    errorMsg.innerHTML = message;
    errorMsg.classList.add("show");

    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    errorTimeout = setTimeout(() => {
      errorMsg.classList.remove("show");
    }, 2000);
  }
}
