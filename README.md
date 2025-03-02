Long time ago I ported a certain puzzle game ("Kulki", or 5-in-a-row) into a web application. Web is the most commonplace platform, anyone with a computer with a browser, including mobile devices, can play it. Now it's time to port it to a very exotic and unusual platform.

## Target platform

The target platform is MVS TK5 running on Hercules emulator. It emulates a System/370 mainframe computer, running the operating system MVS 3.8j. The programming language is Rexx, specifically the [BREXX/370](https://brexx370.readthedocs.io/en/latest/index.html) implementation.

The repository also includes an intermediate prototype of the game, written in JavaScript, running on Node.js, for fully testing the game logic on a modern computer, before porting it to Rexx. The prototype isn't written in modern idiomatic JavaScript, but in a style that can be easily translated to Rexx, keeping the limitations of the target language in mind.

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

### Improved pathfinding algorithm, returning the path

The modification of the BFS algorithm described above is to save list of available single-step paths. When the target cell is reached, the path is reconstructed by following the parent cells. The path is returned as a list of cells. Then, movement of the ball can be animated by moving the ball from the source cell to the target cell, one cell at a time, with a short delay between each move.

This is implemented in the web-based version of the game. The algorithm (BFS-based) and its JavaScript implementation is described in [a separate blog post](https://mieszkogulinski.github.io/pathfinding-algorithm-in-a-puzzle-game).

### Coordinates conversion

The coordinates can be converted to integer values, e.g. A1 = 0, A2 = 1, ..., I9 = 80. The integer coordinates are used to access the elements of the board array, and are used in the pathfinding algorithm (the values on the stack or in the queue are integer coordinates, as the fixed-size array stores integers).

## Implementation

The code [can be split into multiple files](https://brexx370.readthedocs.io/en/latest/calling.html):

- main program
- help page
- code for finding series of balls, as this code is very large, and the main file with this code would be too long to be easily maintainable

The code in the called file is able to access the global variables from the main program, so the code in the third file can access (both read and update) the board array.

## How to upload the code to the TK5 emulator and run the game

[This video tutorial](https://www.youtube.com/watch?v=Ks2YPiP0tys) (from about 14:30) describes how to upload files to the MVS TK4- system using FTP. [This tutorial](https://linuxize.com/post/how-to-use-linux-ftp-command-to-transfer-files/) describes how to use the command-line FTP client on Linux.

1. In the emulator console, look up the running jobs (processes) by using a command `/d a,l`.
2. If the FTP server is not running, start it by using a command `/s ftpd`. The FTP server will be listening on port 2121. (Note that the command given in the TK4- video tutorial, `/start ftpd,srvport=2100`, does not work).
3. Connect to the FTP server listening on port 2121. Provide the login and password for the MVS user just like during logging in to the system. The default user name is `herc01` and the default password is `cul8tr` (in MVS, password checking is case-insensitive).
4. Open the directory with BREXX samples. The directory name should look like `BREXX.V2R5M3.SAMPLES`. Find the correct name among the existing directories.
5. **Set the transfer mode to ASCII, not binary**. This is because MVS internally uses different character encoding (EBCDIC) than modern PCs (Unicode, being a superset of ASCII). Transferring files in ASCII mode enables automatic translation of the encoding, while the binary mode prevents the automatic conversion. Usually you want to disable any type of automatic encoding conversion, because modern systems typically use Unicode, but in the case of uploading text files to MVS (and possibly historical systems) automatic conversion is required.
6. Copy the file `kulki.rexx` to `kulki`
7. Upload the `kulki` file to the BREXX samples directory. Note that the file **doesn't** have filename extension - this is because uploading a file to MVS doesn't work when the file has an extension added.
8. You can verify that the file is uploaded successfully. A file named `KULKI` should be visible among the files in the samples directory.
9. Connect to the emulator using a 3270 terminal emulator (such as c3270 or x3270 on Linux). Log into the system - the default user name and default password is the same as in step 3.
10. Either in the OS command line (opened by closing the main system menu), or in the command input appliction (option 6 in the main system menu on TK5), run the command `rx BREXX.V2R5M3.SAMPLES(KULKI)`.

Note that the dataset name may include some other value than `V2R5M3` - for example, [in this tutorial](https://www.youtube.com/watch?v=JzIyFzF6y9Q), the used TK5 instance uses `V2R5M2`. You need to figure out the correct string yourself, for example using dataset search feature (option 3.4 in the TK5 main system menu), or by listing existing directory names after opening the FTP client.

Also, note that the FTP file transfer fails when some user is logged in the terminal - this results in an error `Not opened 13`.

In the Linux command-line FTP client, the commands are:

1. To open the FTP client: `ftp localhost 2121` (after running this command, you should be prompted for username and password)
2. To list content of the currently active directory (or the root of the file system): `ls`
3. To enter the BREXX samples directory: `cd BREXX.V2R5M3.SAMPLES`
4. To set ASCII mode: `asci`
5. To upload the file with the game: `put kulki`. If the file already exists on the MVS system, this file will be overwritten.
6. To close the FTP client: `quit`

## Future improvements

- colored balls
- interface controlled with arrow keys
- saving the game state and restoring it later, using [dataset functions](https://brexx370.readthedocs.io/en/latest/dataset.html)
