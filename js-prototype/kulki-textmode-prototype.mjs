import inquirer from "inquirer";
import displayHelp from "./displayHelp.mjs";

// This code is non-idiomatic, not using standard JS features.
// This is because it's going to be ported to another language later, and I want to keep the limitations of the target language.
// I wanted to use a language that can be easily ran on a modern computer, because work on the final retrocomputing version, on the target platform, would be much more cumbersome.

const width = 9;
const height = 9;
const colorsCount = 7;
const cellsCount = width * height;

// Game state
const board = new Uint8Array(cellsCount); // colors are marked as 1 - 7; empty cell is 0
let score = 0;

// Queue, implemented as a circular buffer. Count of the elements will never exceed cellsCount.
const queueArray = new Uint8Array(cellsCount);
let queueStartIndex = 0;
let queueLength = 0;

const queuePush = (value) => {
  const targetIndex = (queueStartIndex + queueLength) % cellsCount;
  queueArray[targetIndex] = value;
  queueLength++;
};

const queuePop = () => {
  const value = queueArray[queueStartIndex];
  queueStartIndex = (queueStartIndex + 1) % cellsCount;
  queueLength--;
  return value;
};

const queueClear = () => {
  queueStartIndex = 0;
  queueLength = 0;
};

// Pathfinding algorithm (BFS)

const isCellVisited = new Uint8Array(cellsCount); // 0 = not visited, 1 = visited

const visitCell = (x, y) => {
  // Adds a neighboring cell to the queue, if it's empty and not visited yet
  if (x < 0) return;
  if (x >= width) return;
  if (y < 0) return;
  if (y >= height) return;

  const neighborIndex = y * width + x;
  if (board[neighborIndex] === 0 && isCellVisited[neighborIndex] === 0) {
    queuePush(neighborIndex);
    isCellVisited[neighborIndex] = 1;
  }
};

const checkPathExists = (from, to) => {
  queueClear();
  queuePush(from); // start from the first cell

  // reset isCellVisited
  for (let i = 0; i < cellsCount; i++) {
    isCellVisited[i] = 0;
  }

  while (true) {
    if (queueLength === 0) return false; // no more cells to visit = no path
    const currentlyVisitedCellIndex = queuePop();
    if (currentlyVisitedCellIndex === to) return true; // found the target cell

    const x = currentlyVisitedCellIndex % width;
    const y = Math.floor(currentlyVisitedCellIndex / width);

    visitCell(x - 1, y);
    visitCell(x + 1, y);
    visitCell(x, y - 1);
    visitCell(x, y + 1);
  }
};

// Game logic

const moveBall = (fromIndex, toIndex) => {
  board[toIndex] = board[fromIndex];
  board[fromIndex] = 0;
};

const emptyCellsList = new Uint8Array(cellsCount); // 0 = not empty, 1 = empty
let emptyCellsListCount = 0;

const fillBoardWithSingleBall = () => {
  // Fill the board with a single ball, having a random color.
  // ---
  // The simplest method is to generate a random cell index, and iterate over the board, starting from the generated index, until we find an empty cell.
  // If we reach the end of the board, we continue from the beginning. If we reach the starting index, we stop, as the board is full.
  // This method works, but it has statistical bias. For example, if we have 2 empty cells on the board one after each other,
  // probability of the ball going to the first cell is 80/81, and to the second cell is 1/81.
  // This is because we start from a random cell, and go in one direction, until we find an empty cell.
  // ---
  // The proper way to do this is to create a list of empty cells, and choose one of them randomly. This way, all empty cells have the same probability of being filled.
  // This method is more computationally expensive, but it's not a problem for a small board like this.

  emptyCellsListCount = 0; // reset the list of empty cells

  for (let i = 0; i < cellsCount; i++) {
    if (board[i] === 0) {
      emptyCellsList[emptyCellsListCount] = i;
      emptyCellsListCount++;
    }
  }

  if (emptyCellsListCount === 0) {
    return;
  }

  // Choose a random cell from the list of empty cells
  const randomIndex = Math.floor(Math.random() * emptyCellsListCount);
  const randomCellIndex = emptyCellsList[randomIndex];

  board[randomCellIndex] = Math.floor(Math.random() * colorsCount) + 1;
};

const fillBoardWithBalls = (ballsCount) => {
  // Fill the board with given number of balls, having random colors
  // If there are no empty cells to fill, don't fill the board.

  for (let i = 0; i < ballsCount; i++) {
    fillBoardWithSingleBall();
  }
  return 0;
};

// We must check if the board is full **after** potentially removing series of balls, as this may create new empty cells
// This is why we cannot return this information from fillBoardWithBalls / fillBoardWithSingleBall
// TODO: if it turns out that this check is computationally expensive, we can instead keep track of the number of empty cells, and update it after each move

const checkIsBoardFull = () => {
  for (let i = 0; i < cellsCount; i++) {
    if (board[i] === 0) {
      return 0;
    }
  }
  return 1;
};

// Check if there are 5 or more balls of the same color in a row, column or diagonally, and remove them, updating the score
// Note that if there are both horizontal and vertical series of balls, they should be counted separately,
// e.g. this board has 2 series of 5 balls of the same color:
// 3   1
//     1 2
// 1 1 1 1 1
//   7 1
// 6   1 3 4
// and should award 10 points (5 for each series)
// Diagonal series are counted separately as well
// Returns 1 if any series were removed, 0 otherwise

const horizontalSeriesIndexes = new Uint8Array(cellsCount);
const horizontalSeriesLengths = new Uint8Array(cellsCount);
let horizontalSeriesCount = 0;

const verticalSeriesIndexes = new Uint8Array(cellsCount);
const verticalSeriesLengths = new Uint8Array(cellsCount);
let verticalSeriesCount = 0;

// diagonal series are counted from the top left to the bottom right
const diagonalSeriesIndexes = new Uint8Array(cellsCount);
const diagonalSeriesLengths = new Uint8Array(cellsCount);
let diagonalSeriesCount = 0;

// back-diagonal series are counted from the top right to the bottom left
const backDiagonalSeriesIndexes = new Uint8Array(cellsCount);
const backDiagonalSeriesLengths = new Uint8Array(cellsCount);
let backDiagonalSeriesCount = 0;

const removeSeriesAndUpdateScore = () => {
  // Reset the series lists
  horizontalSeriesCount = 0;
  verticalSeriesCount = 0;
  diagonalSeriesCount = 0;
  backDiagonalSeriesCount = 0;

  // 1. Get the horizontal series, vertical series, diagonal series and back-diagonal series

  // Horizontal series
  for (let y = 0; y < height; y++) {
    // For each row.
    // There will be at most one series of the same color in a row, as the series has to be at least 5 balls long,
    // and there are only 9 columns.
    let currentColor = 0;
    let currentSeriesLength = 0;
    let currentSeriesStartIndex = 0;

    // ...
  }
  // Vertical series
  for (let x = 0; x < width; x++) {
    // For each column.
    let currentColor = 0;
    let currentSeriesLength = 0;
    let currentSeriesStartIndex = 0;

    // ...
  }

  // Diagonal series
  for (let y = 0; y < height; y++) {
    // For each column.
    let currentColor = 0;
    let currentSeriesLength = 0;
    let currentSeriesStartIndex = 0;

    // ...
  }

  // Back-diagonal series
  for (let y = 0; y < height; y++) {
    // For each column.
    let currentColor = 0;
    let currentSeriesLength = 0;
    let currentSeriesStartIndex = 0;

    // ...
  }

  // 2. If no series found, return early

  if (
    horizontalSeriesCount === 0 &&
    verticalSeriesCount === 0 &&
    diagonalSeriesCount === 0
  ) {
    return 0;
  }

  // 3. Calculate the score
  for (let i = 0; i < horizontalSeriesCount; i++) {
    const seriesLength = horizontalSeriesLengths[i];
    score += 5 + (seriesLength - 5) * 2;
  }
  for (let i = 0; i < verticalSeriesCount; i++) {
    const seriesLength = verticalSeriesLengths[i];
    score += 5 + (seriesLength - 5) * 2;
  }
  for (let i = 0; i < diagonalSeriesCount; i++) {
    const seriesLength = diagonalSeriesLengths[i];
    score += 5 + (seriesLength - 5) * 2;
  }
  for (let i = 0; i < backDiagonalSeriesCount; i++) {
    const seriesLength = backDiagonalSeriesLengths[i];
    score += 5 + (seriesLength - 5) * 2;
  }

  // 4. Remove the horizontal series, vertical series, diagonal series and back-diagonal series
  // Horizontal series
  for (
    let seriesIndex = 0;
    seriesIndex < horizontalSeriesCount;
    seriesIndex++
  ) {
    const seriesLength = horizontalSeriesLengths[seriesIndex];
    const startCellIndex = horizontalSeriesIndexes[seriesIndex];

    for (let counter = 0; counter < seriesLength; counter++) {
      const cellIndex = startCellIndex + counter;
      board[cellIndex] = 0;
    }
  }
  // Vertical series
  for (let seriesIndex = 0; seriesIndex < verticalSeriesCount; seriesIndex++) {
    const seriesLength = verticalSeriesLengths[seriesIndex];
    const startCellIndex = verticalSeriesIndexes[seriesIndex];

    for (let counter = 0; counter < seriesLength; counter++) {
      const cellIndex = startCellIndex + counter * width;
      board[cellIndex] = 0;
    }
  }
  // Diagonal series
  for (let seriesIndex = 0; seriesIndex < diagonalSeriesCount; seriesIndex++) {
    const seriesLength = diagonalSeriesLengths[seriesIndex];
    const startCellIndex = diagonalSeriesIndexes[seriesIndex];

    for (let counter = 0; counter < seriesLength; counter++) {
      const cellIndex = startCellIndex + counter * (width + 1);
      board[cellIndex] = 0;
    }
  }
  // Back-diagonal series
  for (
    let seriesIndex = 0;
    seriesIndex < backDiagonalSeriesCount;
    seriesIndex++
  ) {
    const seriesLength = backDiagonalSeriesLengths[seriesIndex];
    const startCellIndex = backDiagonalSeriesIndexes[seriesIndex];

    for (let counter = 0; counter < seriesLength; counter++) {
      const cellIndex = startCellIndex + counter * (width - 1);
      board[cellIndex] = 0;
    }
  }

  return 1;
};

const performMove = (fromIndex, toIndex) => {
  moveBall(fromIndex, toIndex);
  const anySeriesRemoved = removeSeriesAndUpdateScore();
  if (!anySeriesRemoved) {
    fillBoardWithBalls(3);
    removeSeriesAndUpdateScore();
  }

  const isBoardFull = checkIsBoardFull();
  if (isBoardFull) return 1;
  return 0;
};

// Input/output functions

// Convert command to indexes, e.g. "A1" -> 0, "B1" -> 1, ..., "A2" -> 9, "B2" -> 10, ..., "I9" -> 80
// Returns -1 in case of an invalid cell name

// The board layout looks like this:
// A1 B1 C1 D1 E1 F1 G1 H1 I1
// A2 B2 C2 D2 E2 F2 G2 H2 I2
// ...

// Or:
//   A B C D E F G H I
// 1
// 2
// ...

// TODO figure out how to convert the cell name to the index in the final version,
// as the target platform has different character encoding and different functions for string manipulation
const convertCellNameToIndex = (cellName) => {
  if (!cellName) return -1; // fallback for empty string
  if (cellName.length !== 2) return -1;
  cellName = cellName.toUpperCase();

  const x = cellName.charCodeAt(0) - "A".charCodeAt(0);
  const y = parseInt(cellName[1], 10) - 1;

  if (x < 0 || y < 0) return -1;
  if (x >= width || y >= height) return -1;
  if (Number.isNaN(y)) return -1;

  return y * width + x;
};

const displayBoard = () => {
  console.log("");
  console.log("Score: " + score);
  console.log("    A B C D E F G H I");
  console.log("    -----------------");
  for (let y = 0; y < height; y++) {
    let line = y + 1 + " | ";
    for (let x = 0; x < width; x++) {
      const cellIndex = y * width + x;
      const cellValue = board[cellIndex];
      if (cellValue === 0) {
        line += "  ";
      } else {
        line += cellValue + " ";
      }
    }
    line = line + "| " + (y + 1); // may be removed if we don't want to display the row numbers on the right
    console.log(line);
  }

  // may be removed if we don't want to display the column letters at the bottom
  console.log("    -----------------");
  console.log("    A B C D E F G H I");
};

// Main loop

const run = async () => {
  console.log("Welcome to Kulki (5 in a row) game!");
  console.log("Enter 'h' for help, 'q' to quit");
  fillBoardWithBalls(5);

  while (true) {
    displayBoard();

    const response = await inquirer.prompt([
      { message: "Enter command:", name: "command" },
    ]);
    const { command } = response;
    if (command === "h") {
      displayHelp();
      continue;
    }

    if (command === "q") {
      // Quit
      break;
    }

    const [fromCellName, toCellName] = command.split(" ");
    const fromCellIndex = convertCellNameToIndex(fromCellName);
    const toCellIndex = convertCellNameToIndex(toCellName);

    if (fromCellIndex === -1 || toCellIndex === -1) {
      console.log("Invalid cell name");
      continue;
    }

    if (fromCellIndex === toCellIndex) {
      console.log("You can't move to the same cell");
      continue;
    }

    if (board[fromCellIndex] === 0) {
      console.log("The source cell is empty");
      continue;
    }

    if (board[toCellIndex] !== 0) {
      console.log("The target cell is not empty");
      continue;
    }

    if (!checkPathExists(fromCellIndex, toCellIndex)) {
      console.log("There is no path between the cells");
      continue;
    }

    const isGameOver = performMove(fromCellIndex, toCellIndex);
    if (isGameOver) {
      console.log("Game over! Your score is: " + score);
      break;
    }

    // Check for game over
  }
};

run();
