/**
 * Chess Game Constants
 * Contains game status definitions and initial game state
 */

const { createPosition } = require("./Board/helper.jsx");

/**
 * Game status constants for different game states
 */
const Status = {
    'ongoing': 'Ongoing',
    'promoting': 'Promoting',
    'white': 'White wins',
    'black': 'Black wins',
    'stalemate': 'Game draws due to stalemate',
    'insufficient': 'Game draws due to insufficient material',
}

/**
 * Board coordinate system constants for chess notation and display
 */
const BOARD_COORDINATES = {
    ranks: Array(8).fill().map((x, i) => 8 - i), // [8, 7, 6, 5, 4, 3, 2, 1]
    files: Array(8).fill().map((x, i) => i + 1),  // [1, 2, 3, 4, 5, 6, 7, 8]
    fileLetters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], // Standard chess notation
}

/**
 * Initial game state configuration
 * Contains starting position, turn, and game settings
 */
const initGameState = {
    position: [createPosition()],         // Starting chess position
    turn: 'w',                           // White starts first
    candidateMoves: [],                  // Highlighted possible moves
    status: Status.ongoing,              // Current game status
    promotionSquare: null,               // Square where pawn promotion is occurring
    moveList: [],                        // History of moves played
    castleDirection: {                   // Castling rights for both sides
        w: 'both',                       // White can castle both sides
        b: 'both',                       // Black can castle both sides
    },
    boardCoordinates: BOARD_COORDINATES, // Chess notation coordinates
} 


module.exports={
    Status, 
    initGameState,
    BOARD_COORDINATES
}