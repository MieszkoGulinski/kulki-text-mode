
Long time ago I ported a certain puzzle game ("Kulki", or 5-in-a-row) into a web application. Web is the most commonplace platform, anyone with a computer with a browser, including mobile devices, can play it. Now it's time to port it to a very exotic and unusual platform.

## Target platform

The target platform is MVS TK5 running on Hercules emulator. The platform is a System/370 mainframe computer, and the operating system is MVS 3.8j. The programming language is Rexx, specifically the [BREXX/370](https://brexx370.readthedocs.io/en/latest/index.html) implementation.

There is also an intermediate prototype of the game, written in JavaScript (running on Node.js), for fully testing the game logic on a modern computer, before porting it to Rexx. The prototype isn't written in modern idiomatic JavaScript, but in a style that can be easily translated to Rexx, keeping the limitations of the target language in mind.

## Game rules

The game is simple: you have a 9x9 board with colored balls. The game starts with 5 balls with random locations and random colors. You can move a ball to an empty cell if there is a path of empty cells between the ball and the target cell. If there are 5 or more balls of the same color in a row, column or diagonal, they disappear, and your score is incremented. If the move doesn't result in any series of balls disappearing, additional 3 balls are added to the board, in randomly selected empty cells, and having random colors. The game ends when the grid is full, and there are no more moves available.

There are 7 available ball colors. When a series of 5 balls is removed, the score is incremented by 5. But for more than 5 balls, each ball over 5 is worth 2 points. For example, a series of 6 balls is worth 7 points, and a series of 7 balls is worth 9 points.

## Gameplay

The platform doesn't support graphics, so text mode is the only option. The ball colors are represented by numbers, and empty cells are represented by spaces. The player enters the source and target cell coordinates, separated by a space. The game will display the board and the score after each move.

For example, a screen from the game may look like that:
```
Score: 30
   A B C D E F G H I
 ---------------------
1|                   |1
2|   1               |2
3|                   |3
4|                   |4
5|       4           |5
6|                   |6
7|  2                |7
8|  4            7   |8
9|                   |9
 ---------------------
   A B C D E F G H I
```
To make the board closer to a square, there's a one space distance between each cell horizontally, but not vertically.

To move the ball from cell D4 to cell C2, the player should enter "d4 c2" (the input is case-insensitive). There are also other commands available: "q" to quit the game, and "h" to show the help screen. Typing an incorrect move will result in an error message, for example "There is no ball on the source cell", or "Path is blocked".

Because moving a ball from one cell to another requires an available path (a ball can move vertically or horizontally), e.g. on this board it will be impossible to move a ball from B2 to I9:
```
Score: 95
   A B C D E F G H I
 ---------------------
1|                   |1
2|   1               |2
3|                   |3
4|                   |4
5|       4           |5
6|                   |6
7|  2              3 |7
8|  4          7 7   |8
9|           1       |9
 ---------------------
   A B C D E F G H I
```

## Pathfinding algorithm

### Breadth-first search

The pathfinding algorithm can based on the [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) (BFS) algorithm:

Start with the source cell. Then, from the currently visited cell, check all the neighboring cells. If the neighboring cell is available, add it to the queue of cells to visit. The cell is unavailable, if one of these conditions is met:
- it was already visited
- it's already in the queue
- it's outside the board
- it's occupied by another ball

If the target cell is reached, the path is clear. If the queue becomes empty, the path is blocked. The algorithm only checks if the path is clear, it doesn't return the path itself.

### Depth-first search

The pathfinding algorithm can be also based on the [depth-first search](https://en.wikipedia.org/wiki/Depth-first_search) (DFS) algorithm - it differs from BFS in the order of visiting the cells. In DFS, the cells are visited in a depth-first order, i.e. the algorithm goes as deep as possible along each branch before backtracking. Implementation of DFS differs from BFS in the data structure used to store the cells to visit. In BFS, a queue is used, while in DFS, a stack is used. Otherwise, the algorithm is the same.

DFS will be more efficient than BFS, because of limitations of the used language. Rexx doesn't have a built-in queue data structure, and doesn't support pointers, so the queue needs to be implemented as an array. While a stack can be implemented as an array and a variable storing the current stack size, a queue implemented this way would require shifting of all of the the elements in the array after each dequeue operation. A fixed-size array can be used, as the stack will never be longer than the number of cells on the board. BREXX/370 supports [fixed-size integer arrays created using ICREATE function](https://brexx370.readthedocs.io/en/latest/array.html).

On the other hand, DFS may not find the shortest path, but it will find a path if it exists. The pathfinding algorithm is used to check if the path is clear, not to find the shortest path. It's necessary to determine which of the two algorithms is faster. 

### Improved pathfinding algorithm, returning the path

The modification of the BFS algorithm described above is to save list of available single-step paths. When the target cell is reached, the path is reconstructed by following the parent cells. The path is returned as a list of cells. Then, movement of the ball can be animated by moving the ball from the source cell to the target cell, one cell at a time, with a short delay between each move.

This is implemented in the web-based version of the game. The algorithm (BFS-based) and its JavaScript implementation is described in [a separate blog post](https://mieszkogulinski.github.io/pathfinding-algorithm-in-a-puzzle-game).

### Coordinates conversion

The coordinates can be converted to integer values, e.g. A1 = 0, A2 = 1, ..., I9 = 80. The integer coordinates are used to access the elements of the board array, and are used in the pathfinding algorithm (the values on the stack or in the queue are integer coordinates, as the fixed-size array stores integers).

## Future improvements

- interface controlled with arrow keys, with colors, using the [formatted screens](https://brexx370.readthedocs.io/en/latest/fss.html) feature
- saving the game state and restoring it later, using [dataset functions](https://brexx370.readthedocs.io/en/latest/dataset.html)

