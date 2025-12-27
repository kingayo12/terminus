const twodmodel = document.querySelector(".mode1");
const twodmode2 = document.querySelector(".mode2");
const twodmode3 = document.querySelector(".mode3");
const twodmode4 = document.querySelector(".mode4");
const twodmode5 = document.querySelector(".mode5");
const twodmode6 = document.querySelector(".mode6");
const twodmode7 = document.querySelector(".mode7");
const twodmode8 = document.querySelector(".mode8");
const pics = document.querySelector("img");
const cover = document.querySelector(".yard");

twodmodel.disabled = true;

twodmode2.addEventListener("click", () => {
  cover.classList.add("isometric");
  twodmode2.disabled = true;
  twodmodel.disabled = false;
  twodmode3.classList.add("comot");
  twodmode4.classList.add("comot");
  twodmode6.classList.add("comot");
  twodmode5.classList.add("comot");
  twodmode7.classList.add("comot2");
  twodmode8.classList.add("comot2");
  cover.style.transform = null;
  //   cover2.classList.add("isometric");
  //   cover3.classList.add("isometric");
});

twodmodel.addEventListener("click", () => {
  cover.classList.remove("isometric");
  cover.classList.add("animate");
  twodmode2.disabled = false;
  twodmodel.disabled = true;
  cover.classList.remove("isometric2");
  twodmode7.classList.remove("comot2");
  twodmode8.classList.remove("comot2");
  twodmode3.classList.remove("comot");
  twodmode4.classList.remove("comot");
  twodmode6.classList.remove("comot");
  twodmode5.classList.remove("comot");
  cover.classList.remove("isometric3");
  cover.classList.remove("isometric4");
  cover.classList.remove("isometric5");
  pics.classList.remove("shadow");
});

twodmode3.addEventListener("click", () => {
  cover.classList.add("isometric2");
  cover.classList.remove("isometric");
  twodmodel.disabled = false;
  cover.classList.remove("isometric3");
  cover.classList.remove("isometric4");
  cover.classList.remove("isometric5");
});

twodmode4.addEventListener("click", () => {
  cover.classList.add("isometric3");
  cover.classList.remove("isometric");
  twodmodel.disabled = false;
  cover.classList.remove("isometric2");
  cover.classList.remove("isometric4");
  cover.classList.remove("isometric5");
});

twodmode5.addEventListener("click", () => {
  cover.classList.remove("isometric");
  cover.classList.add("isometric4");
  twodmodel.disabled = false;
  cover.classList.remove("isometric2");
  cover.classList.remove("isometric3");
  cover.classList.remove("isometric5");
});

twodmode6.addEventListener("click", () => {
  cover.classList.add("isometric");
  twodmodel.disabled = false;
  cover.classList.remove("isometric2");
  cover.classList.remove("isometric3");
  cover.classList.remove("isometric4");
  cover.classList.remove("isometric4");
  cover.classList.remove("isometric5");
});
let deg = 0;
twodmode7.addEventListener("click", () => {
  deg += 90;
  console.log(deg);
  cover.style.transform = `rotate(${deg}deg)`;
});

twodmode8.addEventListener("click", () => {
  deg -= 90;
  console.log(deg);
  cover.style.transform = `rotate(${deg}deg)`;
});
