// ========================= SIDEBAR COLLAPSE =========================
const sidebar = document.getElementById("sidebar");

function handleCollapseToggle() {
  sidebar.classList.toggle("collapsed_menu");
}

function handlemobileToggle() {
  sidebar.classList.toggle("showd");
}

// ========================= THEME POPUP =========================
function handleThemeShow() {
  const wrap = document.querySelector(".theme_wrapper");
  const box = document.querySelector(".boxTheme");

  wrap.classList.add("show");
  box.classList.add("animate__fadeInDown");
}

function closeThemePopup() {
  const wrap = document.querySelector(".theme_wrapper");
  const box = document.querySelector(".boxTheme");

  box.classList.remove("animate__fadeInDown");
  box.classList.add("animate__fadeOutUp");

  box.addEventListener(
    "animationend",
    () => {
      wrap.classList.remove("show");
      box.classList.remove("animate__fadeOutUp");
    },
    { once: true },
  );
}

document.querySelector(".closeThemeBtn").addEventListener("click", closeThemePopup);

// ========================= NOTIFICATION POPUP =========================
function handleNotiPopup() {
  document.querySelector(".noti_box").classList.add("show");
  document.querySelector(".panel_box").classList.remove("show");
}

function closeNotiPopup() {
  const box = document.querySelector(".noti_box");
  box.classList.add("animate__fadeOutUp");

  box.addEventListener(
    "animationend",
    () => {
      box.classList.remove("show", "animate__fadeOutUp");
      box.classList.add("animate__fadeInDown");
    },
    { once: true },
  );
}

function handlePanelPopup() {
  document.querySelector(".panel_box").classList.add("show");
  document.querySelector(".noti_box").classList.remove("show");
}

function closePanelPopup() {
  const box = document.querySelector(".panel_box");
  box.classList.add("animate__fadeOutUp");

  box.addEventListener(
    "animationend",
    () => {
      box.classList.remove("show", "animate__fadeOutUp");
      box.classList.add("animate__fadeInDown");
    },
    { once: true },
  );
}

// ========================= SETTINGS TABS =========================
function handleSettingsMenu(element, tabId) {
  document
    .querySelectorAll(".settings_menu .navlink")
    .forEach((link) => link.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".tabPage").forEach((tab) => tab.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
}

// ========================= MAKE FIRST TAB ACTIVE =========================
document.addEventListener("DOMContentLoaded", () => {
  const firstLink = document.querySelector(".settings_menu .navlink");
  const firstTab = document.querySelector(".tabPage");

  if (firstLink && firstTab) {
    firstLink.classList.add("active");
    firstTab.classList.add("active");
  }
});

// ========================= SIMPLE MENU DEBUG =========================
document.querySelectorAll(".sidebar .menuitems a").forEach((item) => {
  item.addEventListener("click", () => console.log("Menu Clicked"));
});

// ====== PROFILE IMAGE & AVATAR HANDLER ======
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0].toUpperCase())
    .join("")
    .slice(0, 2);
}

function initProfileImage() {
  const profileImg = document.getElementById("profileImg");
  const nameText =
    document.querySelector(".info .name")?.textContent.replace("Name:", "").trim() || "US";

  if (!profileImg.src || profileImg.src.includes("user.png")) {
    profileImg.src = ""; // clear image
    profileImg.alt = getInitials(nameText);
    profileImg.textContent = getInitials(nameText);
    profileImg.style.background = "#007bff";
    profileImg.style.color = "#fff";
    profileImg.style.display = "flex";
    profileImg.style.alignItems = "center";
    profileImg.style.justifyContent = "center";
    profileImg.style.borderRadius = "50%";
    profileImg.style.width = "100px";
    profileImg.style.height = "100px";
    profileImg.style.fontSize = "36px";
    profileImg.style.fontWeight = "bold";
    profileImg.style.textAlign = "center";
    profileImg.style.lineHeight = "100px";
  } else {
    profileImg.style.background = "none";
    profileImg.textContent = "";
  }
}

// ====== CHANGE PROFILE IMAGE ======
function changeProfileImage() {
  const profileImg = document.getElementById("profileImg");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.click();

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      profileImg.src = event.target.result;
      profileImg.style.background = "none";
      profileImg.textContent = "";
    };
    reader.readAsDataURL(file);
  });
}

// ====== SELECT AVATAR ======
function selectAvatar(imgElement) {
  const profileImg = document.getElementById("profileImg");
  profileImg.src = imgElement.src;
  profileImg.style.background = "none";
  profileImg.textContent = "";
}

// ====== CANCEL & SAVE BUTTONS ======
function cancelProfileChanges() {
  alert("Changes canceled"); // Replace with actual revert logic
  initProfileImage(); // Reset image to initials/avatar
}

function saveProfileChanges() {
  alert("Profile saved"); // Replace with actual save logic
}

function toggleSettingsMenu() {
  const menu = document.querySelector(".settings_menu");
  menu.classList.toggle("open");
}
