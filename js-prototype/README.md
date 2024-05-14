# JavaScript (Node.js) prototype

This is a prototype of the game Kulki (5 in a row) in JavaScript, running on Node.js with `inquirer` library for input. This prototype is a text-mode version of the game, with the game board displayed as text, and the player entering the moves as text commands. This is done to figure out the correct algorithms before porting it to the retrocomputing version (Rexx running on MVS, specifically [BREXX/370](https://brexx370.readthedocs.io/en/latest/index.html) implementation).

The code is not idiomatic JavaScript, but JavaScript made to keep the limitations of Rexx language. That's why, for example:

- Standard JavaScript arrays are not used. Standard arrays support `splice`, and `splice` can be used to implement a queue, necessary for the BFS-based pathfinding algorithm. Instead, `Uint8Array` are used, mimicking the fixed-size integer arrays available in Rexx. The queue is implemented a circular buffer. Because the queue will never be longer than the board size, the array can be fixed size.
- we use 0 as a false value, and 1 as a true value, as Rexx does not have boolean values
- we use global variables for the game state, and for the temporary arrays

Don't look at this code as a good example of JavaScript programming. It's a prototype for a game that will be later ported to Rexx.

To install the dependencies, run `npm install`, to run the game, run `node kulki-textmode-prototype.mjs` (`mjs`, so that we can use `import`, because `inquirer` is not compatible with `require`).

## Acknowledgements

Large part of the code was written by GitHub Copilot.
