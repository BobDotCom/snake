export const loadStyles = () => {
  chrome.storage.sync.get("theme", ({ theme }) => {
    let color;
    let text;
    let icon;
    switch (theme) {
        case "dark":
            color = "dimgray";
            text = "white";
            icon  = "black";
            break;
        case "light":
            color = "lightgray";
            text = "black";
            icon = "white";
    }
    document.documentElement.style.setProperty('--theme', color);
    document.documentElement.style.setProperty('--text', text);
    document.documentElement.style.setProperty('--icon', icon);
  });
  chrome.storage.sync.get("popupsize", ({ popupsize }) => {
      document.documentElement.style.setProperty('--size', `${popupsize}px`);
  });
  chrome.storage.sync.get("boardSize", ({ boardSize }) => {
      document.documentElement.style.setProperty('--icon-size', `calc(calc(var(--size) / ${boardSize}) - 3px)`);
  });
}