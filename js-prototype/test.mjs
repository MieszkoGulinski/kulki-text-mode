import removeSeriesAndUpdateScore from "./removeSeriesAndUpdateScore.mjs";

const checkBoard = (board, correctScore, shouldBeEmptyAfterRemoval) => {
  const boardAsUint8Array = new Uint8Array(board);
  const score = removeSeriesAndUpdateScore(boardAsUint8Array);
  console.log(score, correctScore);

  if (shouldBeEmptyAfterRemoval && !isBoardEmpty(boardAsUint8Array)) {
    console.log("Board not empty after removal");
  }

  return boardAsUint8Array;
};

const isBoardEmpty = (board) => {
  return board.every((cell) => cell === 0);
};

// Empty board
//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
], 0, true)

// Sparse board, no series
//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,1,0,0,0,0,4,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,2,0,0,0,0,0,
  0,0,0,0,0,6,0,0,2,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,7,0,
], 0)

// Board with one series
//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,1,0,0,0,0,4,
  0,0,0,1,0,0,0,0,0,
  0,0,0,1,0,0,0,0,0,
  0,0,0,1,0,0,0,0,0,
  0,0,0,1,0,6,0,0,2,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,7,0,
], 5)

// Board with two series
//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,1,0,0,0,0,4,
  0,0,0,1,0,0,0,0,0,
  0,0,0,1,0,0,0,0,0,
  0,0,0,1,0,0,0,0,0,
  0,0,0,1,0,6,0,0,2,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,7,7,7,7,7,
], 10)

// Board with two diagonal series
//prettier-ignore
checkBoard([
  0,0,0,2,0,0,0,0,0,
  0,0,0,0,2,0,0,0,0,
  1,0,0,0,0,2,0,0,0,
  0,1,0,0,0,0,2,0,0,
  0,0,1,0,0,0,0,2,0,
  0,0,0,1,0,0,0,0,0,
  0,0,0,0,1,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
], 10, true)

// Board with three series
//prettier-ignore
checkBoard([
  0,0,0,2,0,0,0,0,0,
  0,0,0,0,2,0,0,0,0,
  1,0,0,0,0,2,0,0,0,
  0,1,0,0,0,0,2,0,0,
  4,0,1,0,0,0,0,2,0,
  4,0,0,1,0,0,0,0,0,
  4,0,0,0,1,0,0,0,0,
  4,0,0,0,0,0,0,0,0,
  4,0,0,0,0,0,0,0,0,
], 15, true)

// Board with intersecting series
//prettier-ignore
checkBoard([
  1,1,1,1,1,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
], 10, true)

// Board with 7-ball series
//prettier-ignore
checkBoard([
  1,1,1,1,1,1,1,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  1,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
], 18, true) // each 7-ball series gives 9 points

// Boards with series that end at the ending edges of the board (right and bottom)
//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,1,1,1,1,1,
], 5, true)

//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,1,
  0,0,0,0,0,0,0,0,1,
  0,0,0,0,0,0,0,0,1,
  0,0,0,0,0,0,0,0,1,
  0,0,0,0,0,0,0,0,1,
], 5)

//prettier-ignore
checkBoard([
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,1,0,0,0,0,
  0,0,0,0,0,1,0,0,0,
  0,0,0,0,0,0,1,0,0,
  0,0,0,0,0,0,0,1,0,
  0,0,0,0,0,0,0,0,1,
], 5, true)
