// Snake game, (c) BobDotCom 2021, MIT license


// imports
import { loadStyles } from "./preloader.js";

// Initialization
let gameToggle = document.getElementById("toggleGame");
let messageBox = document.getElementById("messageBox");
let scoreBox = document.getElementById("score");
let highScoreBox = document.getElementById("highScore");
let theme = {};
let running;
let direction;
let score;
let gameDifficulty;
let highScores;
let size;

// Fetch stored info
chrome.storage.sync.get("color", ({ color }) => {
  theme.primary = color;
});
chrome.storage.sync.get("difficulty", ({ difficulty }) => {
  gameDifficulty = difficulty;
});
chrome.storage.sync.get("highscores", ({ highscores }) => {
  highScores = highscores;
});
chrome.storage.sync.get("boardSize", ({ boardSize }) => {
  size = boardSize;
});

class GameBoard {
  constructor() {
    this.elements = [];
    this.board = document.getElementById("gameBoard");
  }

  async initialize(coordinates=null) {
    if (coordinates !== null) {
      size = coordinates.boardSize;
    }
    this.board.style.gridTemplate = `repeat(${size}, 1fr) / repeat(${size}, 1fr)`;
    while (this.board.firstChild) {
      // remove all children, in case we're restarting or something
      this.board.removeChild(this.board.lastChild);
    }
    let tempElement;
    for (let x = 1; x < size + 1; x++) {
      for (let y = 1; y < size + 1; y++) {
        tempElement = document.createElement("div");
        tempElement.classList.add("pixel");
        tempElement.setAttribute("data-x", String(x));
        tempElement.setAttribute("data-y", String(y));
        tempElement.style.gridColumn = `${y} / span 1`;
        tempElement.style.gridRow = `${x} / span 1`;
        tempElement.style.backgroundColor = theme.primary;
        this.board.appendChild(tempElement)
        this.elements.push({
          'element': tempElement,
          'location': [x, y]
        });
        await this.renderTile([x,y], false)
      }
    }
  }

  async renderTile(coordinate, toggle=null, message=null) {
    console.log(`toggling ${toggle} at ${JSON.stringify(coordinate)}`)
    let element = this.elements.find(e => {
      for (let i = 0; i < e.location.length; ++i) {
        if (e.location[i] !== coordinate[i]) return false;
      }
      return true;
    }).element;
    switch (toggle) {
      case true:
        element.style.display = null;
        break;
      case false:
        element.style.display = "none";
        break;
      default:
        element.style.display = element.style.display === "none" ? null : "none";
    }
    if (message) {
      let rendered = document.createElement("span");
      rendered.classList.add("material-icons");
      switch (message) {
        case "bonus":
          rendered.innerText = "card_giftcard";
          break;
        case "head":
          rendered.innerText = "emoji_emotions";
          break;
      }
      let specialTiles = this.elements.filter(o => o.element.childElementCount > 0);
      for (let tile of specialTiles) {
        let toRemove = [...tile.element.children].filter(e => e.innerText === rendered.innerText);
        while (toRemove.length > 0) {
          tile.element.removeChild(toRemove.pop());
        }
      }
      element.appendChild(rendered);
    }
  }

  async renderBoard(coordinates) {
    for (let coordinate of coordinates.view()) {
      await this.renderTile(coordinate, true);
    }
    await this.renderTile(coordinates.last(), true, "head"); // show new tile
    for (let bonus of await coordinates.processBonuses()) {
      // render bonuses
      await this.renderTile(bonus, true, "bonus");
    }
    await this.renderHighScore()
    await this.renderScore()
  }

  async renderScore() {
    scoreBox.innerHTML = `Score<br>${score}`;
  }

  async renderHighScore() {
    highScoreBox.innerHTML = `High Score<br>${highScores[gameDifficulty]}`;
  }

  async renderNext(coordinates, boardSize) {
    let last = coordinates.last();
    let next;
    switch (direction) {
      case 1:
        next = [last[0], addMax(last[1], -1, boardSize)];
        break;
      case 2:
        next = [addMax(last[0], -1, boardSize), last[1]];
        break;
      case 3:
        next = [last[0], addMax(last[1], 1, boardSize)];
        break;
      case 4:
        next = [addMax(last[0], 1, boardSize), last[1]];
    }
    // let getsBigger = Math.random() > 0.9; // luck based growth, depreciated for growth upon consumption of bonus
    // this new method checks if the snake's head is on top of a bonus
    let getsBigger = (await coordinates.processBonuses()).some(a => next.every((v, i) => v === a[i]));
    if (getsBigger === true) {
      await showMessage("You got bigger");
      await coordinates.removeBonus(next);
      await incrementScore();
    }
    if (coordinates.view().some(a => next.every((v, i) => v === a[i])) === true) {
      // ran into self
      console.log(coordinates.view());
      console.log(next);
      await showMessage("Game over");
      await stopGame();
    }
    let hide = await coordinates.next(next, !getsBigger);
    await this.renderTile(hide, false); // hide last tile
    await this.renderTile(next, true, "head"); // show new tile
    for (let bonus of await coordinates.processBonuses()) {
      // render bonuses
      await this.renderTile(bonus, true, "bonus");
    }
    await this.renderScore()
  }
}


class LocationQueue {
  constructor(boardSize) {
    this.coordinates = [
      [1,1],
      [1,2],
      [1,3]
    ];
    this.boardSize = boardSize;
    this.bonuses = [];
  }

  async next(coordinate, shift=true) {
    // push new coordinates, remove old
    this.coordinates.push(coordinate);
    switch (shift) {
      case true:
        return this.coordinates.shift();
      case false:
        return this.coordinates[0];
    }
  }

  async processBonuses(max=1) {
    if (this.bonuses.length < max) {
      this.bonuses.push([randint(1, this.boardSize), randint(1, this.boardSize)]);
    }
    return this.bonuses;
  }

  async removeBonus(coordinate) {
    this.bonuses = this.bonuses.filter(a => !coordinate.every((v, i) => v === a[i]));
  }

  view() {
    return this.coordinates;
  }

  last() {
    return this.coordinates[this.coordinates.length - 1];
  }
}

const addMax = (a, b, max) => {
  return a + b <= max && a + b >= 1 ? a + b : a + b > 0 ? a + b - max : a + b + max;
}

const setDirection = async (e) => {
  switch (e.keyCode) {
    case 37:
      direction = 1;
      break
    case 38:
      direction = 2;
      break
    case 39:
      direction = 3;
      break
    case 40:
      direction = 4;
  }
}

const showMessage = async (message) => {
  let messageElement = document.createElement("p");
  messageElement.innerText = message;
  messageBox.appendChild(messageElement);
  setTimeout(async () => {
    messageElement.remove();
  }, 5000);
}

const randint = (min, max) => { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const incrementScore = async (amount=1) => {
  if (score <= highScores[gameDifficulty] && score + amount > highScores[gameDifficulty]) {
    await showMessage("New high score");
  }
  score += amount;
  if (score > highScores[gameDifficulty]) {
    let highscores = Object.create(highScores);
    highscores[gameDifficulty] = score;
    chrome.storage.sync.set({ highscores });
  }
}

const runFrame = async (gameBoard, coordinates, boardSize) => {
  switch (running) {
      case true:
        await gameBoard.renderNext(coordinates, boardSize);
        // await incrementScore(); // this didnt seem right
  }
  setTimeout(async () => {
    await runFrame(gameBoard, coordinates, boardSize)
  }, 1000 - (gameDifficulty * 5 * score));
}

const runGame = async () => {
  let boardSize = size;
  switch(running) {
    case true:
      throw "Already running";
    default:
      running = true;
  }
  console.time('Load game objects');
  let coordinates = new LocationQueue(boardSize);
  let gameBoard = new GameBoard(coordinates);
  direction = 3;
  score = 0;
  document.addEventListener('keydown', setDirection);
  console.timeEnd('Load game objects');
  console.time('Initialize game board');
  await gameBoard.initialize();
  console.timeEnd('Initialize game board');
  console.time('Render Board');
  await gameBoard.renderBoard(coordinates);
  console.timeEnd('Render Board');
  await runFrame(gameBoard, coordinates, boardSize)
}

const stopGame = async () => {
  running = false;
  gameToggle.innerText = 'Start Game';
}

const startGame = async () => {
  gameToggle.innerText = 'Stop Game';
  await runGame();
}

const toggleGame = async () => {
  switch (running) {
    case true:
      await stopGame();
      break;
    default:
      await startGame();
  }
}

// start game when button clicked
gameToggle.addEventListener("click", toggleGame);
loadStyles(); // load styles from storage