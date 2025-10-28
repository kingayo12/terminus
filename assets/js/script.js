const sidebar = document.getElementById("sidebar");
const collapseBtn = document.querySelector(".collapse_btn");
const overlay = document.querySelector(".menu_overlay");

const handleCollapseToggle = () => {
  sidebar.classList.toggle("collapsed_menu");
};

// ---------------------------- theme switcher ----------------------------
const handleThemeSwitch = () => {
  const body = document.body;
  const toggleThemeBtn = document.querySelector(".toggle_theme");
  toggleThemeBtn.classList.toggle("dark");
  body.classList.toggle("dark-theme");
};

// -----------------------theme box-----------------------
const boxThemes = document.querySelectorAll(".boxTheme .boxTheme1");
boxThemes.forEach((boxTheme) => {
  boxTheme.addEventListener("click", () => {
    const selectedTheme = boxTheme.classList[1];
    document.body.className = "";
    document.body.classList.add(selectedTheme);
  });
});

const handleThemeShow = () => {
  const boxThemeContainer = document.querySelector(".theme_wrapper");
  const boxTheme = document.querySelector(".boxTheme");

  // Show the wrapper and animate the popup in
  boxThemeContainer.classList.add("show");
  boxTheme.classList.remove("animate__fadeOutUp");
  boxTheme.classList.add("animate__fadeInDown");
};

const closeThemePopup = () => {
  const wrapper = document.querySelector(".theme_wrapper");
  const boxTheme = document.querySelector(".boxTheme");

  // Animate the popup out
  boxTheme.classList.remove("animate__fadeInDown");
  boxTheme.classList.add("animate__fadeOutUp");

  // Wait for the animation to finish before hiding
  boxTheme.addEventListener(
    "animationend",
    () => {
      wrapper.classList.remove("show");
      boxTheme.classList.remove("animate__fadeOutUp");
    },
    { once: true },
  );
};

// Attach event listener to close button
document.querySelector(".closeThemeBtn").addEventListener("click", closeThemePopup);

// ================= NOTIFICATION MODAL =================
function handleNotiPopup() {
  document.querySelector(".noti_box").classList.add("show");
  document.querySelector(".panel_box").classList.remove("show");
}

function closeNotiPopup() {
  const notiBox = document.querySelector(".noti_box");
  notiBox.classList.add("animate__fadeOutUp");
  notiBox.addEventListener(
    "animationend",
    () => {
      notiBox.classList.remove("show", "animate__fadeOutUp");
      notiBox.classList.add("animate__fadeInDown");
    },
    { once: true },
  );
}

function handlePanelPopup() {
  document.querySelector(".panel_box").classList.add("show");
  document.querySelector(".noti_box").classList.remove("show");
}

function closePanelPopup() {
  const panelBox = document.querySelector(".panel_box");
  panelBox.classList.add("animate__fadeOutUp");
  panelBox.addEventListener(
    "animationend",
    () => {
      panelBox.classList.remove("show", "animate__fadeOutUp");
      panelBox.classList.add("animate__fadeInDown");
    },
    { once: true },
  );
}

// --------------------menu items -----------------------
const menuItmes = document.querySelectorAll(".sidebar .menuitems a");

menuItmes.forEach((item) => {
  item.addEventListener("click", () => {
    alert("me");
  });
});
