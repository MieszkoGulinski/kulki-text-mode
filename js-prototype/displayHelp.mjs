const displayHelp = () => {
  console.log("Rules:");
  console.log(
    "- You can move balls from one cell to another, if the path from the source and target cell exists"
  );
  console.log(
    "- The ball can move only horizontally or vertically, not diagonally"
  );
  console.log(
    "- If there are 5 or more balls of the same color in a row, column or diagonally, they disappear, and your score is increased"
  );
  console.log(
    "If there are 5 balls in a series, you get 5 points. If there are more than 5 balls in a row, you get 2 points for each additional ball. For example, 6 balls in a row give you 7 points, 7 balls in a row give you 9 points, etc."
  );
  console.log(
    "- After each move, if the move doesn't result in any series of balls disappearing, 3 new balls are added to the board"
  );
  console.log(
    "- The game ends when the board is completely filled with balls, and there are no more moves possible"
  );
  console.log("Gameplay command format:");
  console.log(
    "(source cell name) (target cell name) - move ball from one cell to another"
  );
  console.log("e.g. A1 B1 - move ball from A1 to B1 (case-insensitive)");
  console.log("");
  console.log("Other commands:");
  console.log("q - quit");
  console.log("h - display this help");
  console.log("");
};

export default displayHelp;
