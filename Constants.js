const { createPosition } =require("./Board/helper.jsx");

const Status ={
    'ongoing': 'Ongoing', 
    'promoting' : 'Promoting',
    'white' : 'White wins', 
    'black' : 'Black wins',
    'stalemate' : 'Game draws due to stalemate', 
    'insufficient' : 'Game draws due to insufficient material',
}

// Board coordinate system constants
const BOARD_COORDINATES = {
    ranks: Array(8).fill().map((x, i) => 8 - i), // [8, 7, 6, 5, 4, 3, 2, 1]
    files: Array(8).fill().map((x, i) => i + 1),  // [1, 2, 3, 4, 5, 6, 7, 8]
    fileLetters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], // Standard chess notation
}

const initGameState = {
    position: [createPosition()], 
    turn:'w',
    candidateMoves :  [],
    status: Status.ongoing, 
    promotionSquare: null, 
    moveList: [],
    castleDirection : {
        w : 'both', 
        b : 'both', 
    },
    boardCoordinates: BOARD_COORDINATES, // Add coordinates to game state
} 


module.exports={
    Status, 
    initGameState,
    BOARD_COORDINATES
}