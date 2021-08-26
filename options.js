import { loadStyles } from "./preloader.js";

let page = document.getElementById("buttonDiv");
let picker = document.getElementById("color");
let themePickers = document.getElementsByName("theme");
let difficultyPicker = document.getElementById("difficulty");
let sizePicker = document.getElementById("boardSize");
let popupSizePicker = document.getElementById("popupSize");
const presetButtonColors = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1"];

// Reacts to a button click by marking the selected button and saving
// the selection
function handleButtonClick(event) {
  let color = event.target.getAttribute("data-color");
  picker.value = color;
  chrome.storage.sync.set({ color });
}

// Add a button to the page for each supplied color
function constructOptions(buttonColors) {
  chrome.storage.sync.get("color", (data) => {
    // For each color we were provided…
    for (let buttonColor of buttonColors) {
      // …create a button with that color…
      let button = document.createElement("button");
      button.dataset.color = buttonColor;
      button.style.backgroundColor = buttonColor;

      // …and register a listener for when that button is clicked
      button.addEventListener("click", handleButtonClick);
      page.appendChild(button);
    }
  });
}

// Initialize the page by constructing the color options
constructOptions(presetButtonColors);

picker.addEventListener("input", (e) => {
  let color = e.target.value;
  chrome.storage.sync.set({ color });
})

difficultyPicker.addEventListener("input", (e) => {
  let difficulty = e.target.value;
  chrome.storage.sync.set({ difficulty });
});

popupSizePicker.addEventListener("input", (e) => {
  let popupsize = e.target.value;
  chrome.storage.sync.set({ popupsize });
});

for (let themePicker of themePickers) {
  themePicker.addEventListener("input", (e) => {
    let theme = e.target.value;
    chrome.storage.sync.set({ theme });
    loadStyles();
  });
}

sizePicker.addEventListener("input", (e) => {
  let boardSize = e.target.value;
  chrome.storage.sync.set({ boardSize });
});

chrome.storage.sync.get("boardSize", ({ boardSize }) => {
  sizePicker.value = boardSize;
});

chrome.storage.sync.get("popupsize", ({ popupsize }) => {
  popupSizePicker.value = popupsize;
});

chrome.storage.sync.get("color", ({ color }) => {
  picker.value = color;
});

chrome.storage.sync.get("theme", ({ theme }) => {
  document.getElementById(theme).setAttribute("checked", "");
});

chrome.storage.sync.get("difficulty", ({ difficulty }) => {
  difficultyPicker.value = difficulty;
});

loadStyles(); // load styles from storage