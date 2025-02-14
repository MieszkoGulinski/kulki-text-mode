/* Implementation of game Kulki (5 in a row) in Rexx, particularly BREXX/370 running on MVS TK5 */

/* It uses BREXX/370-specific functions such as integer arrays and fullscreen output mode */

CALL IMPORT FSSAPI
ADDRESS FSS
CALL FSSINIT
CALL FSSTITLE 'Kulki (5 in a row)', #WHITE+#PROT
CALL FSSTEXT 'Move ===>', 3, 6, , #WHITE+#PROT
CALL FSSFIELD 'MOVE', 3, 16, , #GREEN
CALL FSSCURSOR 'MOVE'

CALL FSSTEXT 'A B C D E F G H I', 5, 6, , #WHITE+#PROT
CALL FSSTEXT '-------------------', 6, 5, , #WHITE+#PROT
CALL FSSTEXT '-------------------', 16, 5, , #WHITE+#PROT
CALL FSSTEXT 'A B C D E F G H I', 17, 6, , #WHITE+#PROT

CALL FSSFIELD 'STATUS', 19, 6, , #RED+#PROT
CALL FSSTEXT 'Score:', 21, 6, , #WHITE+#PROT
CALL FSSFIELD 'SCORE', 21, 12, , #GREEN+#PROT

/* to use the debug field, call in the code: */
/* CALL FSSFSET('DEBUG', queueLength) */
CALL FSSFIELD 'DEBUG', 23, 6, , #RED+#PROT

width = 9
height = 9
colorCount = 7
cellsCount = width * height

board = ICREATE(cellsCount, NULL)
score = 0

/* Queue for breadth-first search */
queueArray = ICREATE(cellsCount, NULL)
queueStartIndex = 0
queueLength = 0

/* Array storing if a cell is visited or not, for pathfinding algorithm. Stores 0 (false) or 1 (true). */
isCellVisited = ICREATE(cellsCount, NULL)

/* Array storing indices of empty cells */
emptyCellsList = ICREATE(cellsCount, NULL)
emptyCellsCount = 0

/* Temporary copy of the board, used when removing series of balls */
tempBoard = ICREATE(cellsCount, NULL)

/* State of the series search */
currentSeriesStartX = 0
currentSeriesStartY = 0
currentSeriesCount = 0
currentSeriesColor = 0

/* Initial board */
CALL fillBoardWithBalls(5)

/* Main game loop */
DO FOREVER
  /* Display the board and score */
  DO y=0 TO height-1
    line = '' || y+1 || '| '

    DO x=0 TO width-1
      cellIndex = y*width+x
      cellValue = IGET(board,cellIndex+1) /* in Rexx, array indexes start with 1 */
      IF cellValue = 0 THEN
        line = line || '  '
      ELSE
        line = line || cellValue || ' '
    END

    line = line || '| ' || y+1

    CALL FSSTEXT line, y+7, 3, , #WHITE+#PROT /* TODO: later we may use color-coded balls */
  END
  CALL FSSFSET 'SCORE', score

  key = FSSREFRESH()
  IF key = 243 THEN LEAVE /* F3 to close the game */
  IF key = 241 THEN DO /* F1 to display help */
    CALL displayHelp
    ITERATE
  END
  userCommand = FSSFGET('MOVE')

  CALL FSSFSET 'MOVE', '     ' /* Clear the field */
  CALL FSSCURSOR 'MOVE'

  message = runUserCommand(userCommand)
  CALL FSSFSET 'STATUS', message
END

CALL FSSCLOSE /* Terminate Screen Environment */
RETURN 0

decodeColIndex:
  ARG colChar
  IF colChar='A' THEN RETURN 0
  IF colChar='B' THEN RETURN 1
  IF colChar='C' THEN RETURN 2
  IF colChar='D' THEN RETURN 3
  IF colChar='E' THEN RETURN 4
  IF colChar='F' THEN RETURN 5
  IF colChar='G' THEN RETURN 6
  IF colChar='H' THEN RETURN 7
  IF colChar='I' THEN RETURN 8
RETURN -1 /* invalid */

decodeRowIndex:
  ARG rowChar
  IF datatype(rowChar) <> 'NUM' THEN RETURN -1 /* invalid */
  IF rowChar < 1 THEN RETURN -1
  IF rowChar > 9 THEN RETURN -1
RETURN rowChar - 1 /* convert to zero-based index */

/* Returns an error (or debug) message, or empty string on no error */
runUserCommand:
  ARG userCommand /*e.g. "A3 B4" or "C5 B6" (automatically converted to uppercase by ARG command) */

  startCol = decodeColIndex(substr(userCommand, 1, 1))
  startRow = decodeRowIndex(substr(userCommand, 2, 1))
  endCol = decodeColIndex(substr(userCommand, 4, 1))
  endRow = decodeRowIndex(substr(userCommand, 5, 1))

  IF startCol = -1 | startRow = -1 | endCol = -1 | endRow = -1 THEN RETURN 'Incorrect command'

  startCellIndex = startRow * width + startCol
  endCellIndex = endRow * width + endCol

  IF IGET(board,startCellIndex+1) = 0 THEN RETURN 'Start cell is empty'
  IF IGET(board,endCellIndex+1) <> 0 THEN RETURN 'End cell is not empty'
  IF checkPathExists(startCellIndex, endCellIndex) = 0 THEN RETURN 'No path between the cells'
  isGameOver = performMove(startCellIndex, endCellIndex)
  IF isGameOver = 1 THEN RETURN 'Game over'
RETURN ''

/* Returns 1 if there are no more moves possible */
performMove:
  ARG startCellIndex, endCellIndex
  CALL moveBall(startCellIndex, endCellIndex)

  scoreIncrement = removeSeriesAndUpdateScore()
  score = score + scoreIncrement
  IF scoreIncrement = 0 THEN DO
    CALL fillBoardWithBalls(3)
    scoreIncrement = removeSeriesAndUpdateScore()
    score = score + scoreIncrement
  END

  isBoardFull = checkIsBoardFull()
  RETURN isBoardFull
RETURN 0

/* Queue operations for BFS-based pathfinding algorithm */
/* Queue contains zero-based cell indices */

queuePush:
  ARG valueToPush
  targetIndex = (queueStartIndex + queueLength) // cellsCount /* zero-based because of using modulo */
  CALL ISET(queueArray, targetIndex + 1, valueToPush)
  queueLength = queueLength + 1
RETURN

queuePop:
  valueFromQueue = IGET(queueArray, queueStartIndex + 1)
  queueStartIndex = (queueStartIndex + 1) // cellsCount
  queueLength = queueLength - 1
RETURN valueFromQueue

queueClear:
  queueLength = 0
RETURN

/* Pathfinding algorithm */
visitCell:
  /* Adds a cell to the queue, if it exists (its coordinates are valid), it's empty and not visited yet */
  /* Note that this function may be called for cells outside the board, then such cells should be ignored */
  ARG x, y
  IF x < 0 THEN RETURN
  IF x >= width THEN RETURN
  IF y < 0 THEN RETURN
  IF y >= height THEN RETURN
  
  cellIndex = y * height + x
  cellIndexOneBased = cellIndex + 1
  
  IF IGET(board,cellIndexOneBased) <> 0 THEN RETURN
  IF IGET(isCellVisited,cellIndexOneBased) = 1 THEN RETURN

  CALL ISET(isCellVisited, cellIndexOneBased, 1) /* mark as visited */
  CALL queuePush(cellIndex)
RETURN

checkPathExists:
  ARG startCellIndex, endCellIndex /* zero based */
  CALL queueClear

  /* Reset isCellVisited */
  DO i=1 TO cellsCount
    CALL ISET(isCellVisited, i, 0)
  END

  CALL queuePush(startCellIndex) /* Start from the first cell */

  DO FOREVER
    IF queueLength = 0 THEN RETURN 0 /* no more cells to visit = no path */
    currentlyVisitedCellIndex = queuePop()
    IF currentlyVisitedCellIndex = endCellIndex THEN RETURN 1

    /* in REXX, // means remainder (modulo) and % means integer division */
    /* for some unclear reason, // causes rounding off errors (1.000000003) so the number must be rounded */
    growStartX = format(currentlyVisitedCellIndex // width)
    growStartY = format(currentlyVisitedCellIndex % width)

    CALL visitCell(growStartX-1, growStartY)
    CALL visitCell(growStartX+1, growStartY)
    CALL visitCell(growStartX, growStartY-1)
    CALL visitCell(growStartX, growStartY+1)
  END
RETURN 1

moveBall:
  ARG startCellIndex, endCellIndex /* zero based */
  color = IGET(board, startCellIndex + 1)
  CALL ISET(board, startCellIndex + 1, 0)
  CALL ISET(board, endCellIndex + 1, color)
RETURN

checkIsBoardFull:
  DO i=1 TO cellsCount
    color = IGET(board, i)
    IF color = 0 THEN RETURN 0
  END
RETURN 1

fillBoardWithBalls:
  ARG addedBallsCount
  DO i=1 TO addedBallsCount
    CALL fillBoardWithSingleBall
  END
RETURN

/* Find a random empty cell and find it with a ball of random color */
/* To ensure uniform distribution, internally the function makes a list of available empty cells, and */
/* randomly selects one from these cells. */

fillBoardWithSingleBall:
  emptyCellsCount = 0
  DO checkedCellIndex=1 TO cellsCount
    cellContent = IGET(board, checkedCellIndex)
    IF cellContent = 0 THEN DO
      emptyCellsCount = emptyCellsCount + 1
      CALL ISET(emptyCellsList, emptyCellsCount, checkedCellIndex) /* emptyCellsList contains 1-based cell indices */
    END
  END

  IF emptyCellsCount = 0 THEN RETURN 0

  randomIndex = RANDOM(1, emptyCellsCount) /* from min to max inclusive */
  targetCellIndex = IGET(emptyCellsList, randomIndex)
  randomColor = RANDOM(1, colorCount)

  CALL ISET(board, targetCellIndex, randomColor)
RETURN 1

/* Identifies series of 5 (or more) balls in the same color, removes them, and returns score increase from these series */

/* Because the series may overlap, e.g. there is a vertical and horizontal series of balls in the same color and a ball is common in both, */
/* we cannot directly remove a series from the board - we must clone the board, remove the series from there, and copy the cloned board into */
/* the main board array. So, while the functions removeHorizontalSeries, removeVerticalSeries etc search for the series on the original board, */
/* they remove the series from tempBoard. */

/* A useful simplification is that because the board is 9x9, and the minimum removed series has 5 balls, there can be at most 1 series in */
/* each row/column/diagonal. So, if we find a deletable series, we can early return from a function and not search for another series. */

removeSeriesAndUpdateScore:
  DO copiedCellIndex=1 TO cellsCount
    color = IGET(board, copiedCellIndex)
    CALL ISET(tempBoard, copiedCellIndex, color)
  END

  partialScore = 0
  /* Horizontal */
  DO searchStartY=0 TO height-1 
    partialScore = partialScore + removeHorizontalSeries(searchStartY)
  END
  /* Vertical */
  DO searchStartX=0 TO width-1
    partialScore = partialScore + removeVerticalSeries(searchStartX)
  END
  /* Top left towards right bottom; x is starting column */
  DO searchStartX=-4 TO width-4
    partialScore = partialScore + removeDiagonalSeries(searchStartX)
  END
  /* Top right towards left bottom; x is starting column */
  DO searchStartX=4 TO width+4
    partialScore = partialScore + removeBackDiagonalSeries(searchStartX)
  END

  DO copiedCellIndex=1 TO cellsCount
    color = IGET(tempBoard, copiedCellIndex)
    CALL ISET(board, copiedCellIndex, color)
  END
RETURN partialScore

/* All these functions accept zero-based argument */

removeHorizontalSeries:
  ARG searchStartY
  CALL resetSeriesSearch
  DO cellX = 0 TO width - 1
    CALL visitCellForSeriesSearch(cellX, searchStartY)
  END
  IF currentSeriesCount >= 5 & currentSeriesColor <> 0 THEN DO
    DO removedBallCounter=0 TO currentSeriesCount-1
      removedCellX = removedBallCounter + currentSeriesStartX
      removedCellY = searchStartY
      removedCellIndex = removedCellY * width + removedCellX + 1
      CALL ISET(tempBoard, removedCellIndex, 0)
    END
    RETURN calculateScoreBySeriesLength(currentSeriesCount)
  END
RETURN 0

removeVerticalSeries:
  ARG searchStartX
  CALL resetSeriesSearch
  DO cellY = 0 TO height - 1
    CALL visitCellForSeriesSearch(searchStartX, cellY)
  END
  IF currentSeriesCount >= 5 & currentSeriesColor <> 0 THEN DO
    DO removedBallCounter=0 TO currentSeriesCount-1
      removedCellX = searchStartX
      removedCellY = removedBallCounter + currentSeriesStartY
      removedCellIndex = removedCellY * width + removedCellX + 1
      CALL ISET(tempBoard, removedCellIndex, 0)
    END
    RETURN calculateScoreBySeriesLength(currentSeriesCount)
  END
RETURN 0

removeDiagonalSeries:
  ARG searchStartX
  CALL resetSeriesSearch
  DO counter = 0 TO height - 1
    CALL visitCellForSeriesSearch(searchStartX + counter, counter)
  END
  IF currentSeriesCount >= 5 & currentSeriesColor <> 0 THEN DO
    DO removedBallCounter=0 TO currentSeriesCount-1
      removedCellX = currentSeriesStartX + removedBallCounter
      removedCellY = currentSeriesStartY + removedBallCounter
      removedCellIndex = removedCellY * width + removedCellX + 1
      CALL ISET(tempBoard, removedCellIndex, 0)
    END
    RETURN calculateScoreBySeriesLength(currentSeriesCount)
  END
RETURN 0

removeBackDiagonalSeries:
  ARG searchStartX
  CALL resetSeriesSearch
  DO counter = 0 TO height - 1
    CALL visitCellForSeriesSearch(searchStartX - counter, counter)
  END
  IF currentSeriesCount >= 5 & currentSeriesColor <> 0 THEN DO
    DO removedBallCounter=0 TO currentSeriesCount-1
      removedCellX = currentSeriesStartX - removedBallCounter
      removedCellY = currentSeriesStartY + removedBallCounter
      removedCellIndex = removedCellY * width + removedCellX + 1
      CALL ISET(tempBoard, removedCellIndex, 0)
    END
    RETURN calculateScoreBySeriesLength(currentSeriesCount)
  END
RETURN 0

visitCellForSeriesSearch:
  ARG x,y /* zero based */
  /* during diagonal and back diagonal search, x may be out of bounds of board, */
  /* and the field can be considered empty and ignored */
  IF x < 0 THEN RETURN
  IF x > (width - 1) THEN RETURN

  cellIndex = y * width + x /* zero based */
  color = IGET(board, cellIndex+1)

  IF color = currentSeriesColor THEN DO
    currentSeriesCount = currentSeriesCount + 1
  END
  /* TODO figure out how to use ELSE with DO...END */
  IF color <> currentSeriesColor THEN DO
    /* there will never be more than 1 series in a line, so if we find a series, we can ignore later balls use the search state */
    /* (even having a series of 5 empty cells will make it impossible for another eligible series to exist) */
    IF currentSeriesCount >= 5 THEN RETURN
    
    currentSeriesStartX = x
    currentSeriesStartY = y
    currentSeriesColor = color
    currentSeriesCount = 1
  END
RETURN

resetSeriesSearch:
  currentSeriesStartX = 0
  currentSeriesStartY = 0
  currentSeriesCount = 0
  currentSeriesColor = 0
RETURN 0

calculateScoreBySeriesLength:
  ARG seriesLength
  IF seriesLength < 5 THEN RETURN 0
RETURN (seriesLength - 5) * 2 + 5

displayHelp:
  /* Using SAY when running in FSS (formatted screen) mode switches to an empty screen displaying the given text (or multiple lines). */
  /* Pressing any key will result in closing the screen and restoring the previous screen. */
  SAY 'How to play:'
  SAY ''
  SAY 'You have a 9x9 grid of cells, each cell can contain a ball.'
  SAY 'The game starts with 5 balls having random colors and random locations.'
  SAY 'You can move a ball from one cell to another, if the target cell is empty, and there is a path to that cell.'
  SAY 'Balls can move only vertically and horizontally.'
  SAY ''
  SAY 'If a move results in getting a series of at least 5 balls having identical number, this series is removed, and your score is updated.'
  SAY 'For a series of 5 balls, your score is increased by 5 points, for each extra ball in the series over 5, you get additional 2 points.'
  SAY 'For example, if you get a series of 6 balls, you get 7 points, and for a series of 8 balls, you get 9 points.'
  SAY 'The series can be horizontal, vertical or diagonal (both diagonal directions).'
  SAY ''
  SAY 'If a move does not result in a series being removed, you get additional 3 balls, with random colors and random locations.'
  SAY 'The game ends when there is no empty cell.'
  SAY ''
  SAY 'To move a ball from one cell to another cell, type the coordinates of the start cell and end cell, in the format "a1 b4".'
  SAY ''
  SAY ''
  SAY 'Have fun!'
RETURN