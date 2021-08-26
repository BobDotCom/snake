// background.js

let color = '#3aa757';
let theme = "dark";
let boardSize = 10;
let difficulty = 1;
let highscores = {}
let popupsize = 300;

for (let i = 1; i <= 10; i++) {
  highscores[i] = 0;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  chrome.storage.sync.set({ difficulty });
  chrome.storage.sync.set({ boardSize });
  chrome.storage.sync.set({ theme });
  chrome.storage.sync.set({ highscores });
  chrome.storage.sync.set({ popupsize });
});