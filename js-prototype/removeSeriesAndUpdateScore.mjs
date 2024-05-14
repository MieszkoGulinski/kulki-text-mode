// This function is moved to a separate file to keep the main file clean.

// Check if there are 5 or more balls of the same color in a row, column or diagonally, and remove them, calculating the score
// Mutates the board array (provided as an argument) by setting the cells with the series of balls to 0

// Note that if there are both horizontal and vertical series of balls, they should be counted separately,
// e.g. this board has 2 series of 5 balls of the same color:
// 3   1
//     1 2
// 1 1 1 1 1
//   7 1
// 6   1 3 4
// and should award 10 points (5 for each series)
// Diagonal series are counted separately as well
// Returns the score.

// These constants will be probably provided as arguments to the function in the final version
const width = 9;
const height = 9;
const cellsCount = width * height;

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

const removeSeriesAndUpdateScore = (board) => {
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
  let partialScore = 0;

  // 3. Calculate the score
  for (let i = 0; i < horizontalSeriesCount; i++) {
    const seriesLength = horizontalSeriesLengths[i];
    partialScore += 5 + (seriesLength - 5) * 2;
  }
  for (let i = 0; i < verticalSeriesCount; i++) {
    const seriesLength = verticalSeriesLengths[i];
    partialScore += 5 + (seriesLength - 5) * 2;
  }
  for (let i = 0; i < diagonalSeriesCount; i++) {
    const seriesLength = diagonalSeriesLengths[i];
    partialScore += 5 + (seriesLength - 5) * 2;
  }
  for (let i = 0; i < backDiagonalSeriesCount; i++) {
    const seriesLength = backDiagonalSeriesLengths[i];
    partialScore += 5 + (seriesLength - 5) * 2;
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

  return partialScore;
};

export default removeSeriesAndUpdateScore;
