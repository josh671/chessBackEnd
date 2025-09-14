// Logic for all the pieces and their movements
const { arbiter } = require('./Arbiter.jsx'); // Import arbiter object

/**
 * Calculates valid moves for a rook piece
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {string} params.piece - The rook piece (e.g., 'wr', 'br')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[rank, file], ...]
 */
const getRookMoves = ({ position, piece, rank, file }) => {
  const moves = [];
  const us = piece[0];
  const enemy = us === 'w' ? 'b' : 'w';

  const directions = [
    [-1, 0], [1, 0], [0, 1], [0, -1]
  ];

  directions.forEach(([dx, dy]) => {
    for (let i = 1; i < 8; i++) {
      const x = rank + i * dx;
      const y = file + i * dy;
      if (position?.[x]?.[y] === undefined) break;
      if (position[x][y].startsWith(enemy)) {
        moves.push([x, y]);
        break;
      }
      if (position[x][y].startsWith(us)) break;
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Calculates valid moves for a knight piece
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[rank, file], ...]
 */
const getKnightMoves = ({ position, rank, file }) => {
  const moves = [];
  const enemy = position[rank][file].startsWith('w') ? 'b' : 'w';

  const candidates = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [-1, 2], [-1, -2], [1, 2], [1, -2]
  ];

  candidates.forEach(([dx, dy]) => {
    const x = rank + dx;
    const y = file + dy;
    const cell = position?.[x]?.[y];
    if (cell !== undefined && (cell.startsWith(enemy) || cell === '')) {
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Calculates valid moves for a bishop piece
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {string} params.piece - The bishop piece (e.g., 'wb', 'bb')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[rank, file], ...]
 */
const getBishopMoves = ({ position, piece, rank, file }) => {
  const moves = [];
  const us = piece[0];
  const enemy = us === 'w' ? 'b' : 'w';
  const directions = [
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  directions.forEach(([dx, dy]) => {
    for (let i = 1; i < 8; i++) {
      const x = rank + i * dx;
      const y = file + i * dy;
      if (position?.[x]?.[y] === undefined) break;
      if (position[x][y].startsWith(enemy)) {
        moves.push([x, y]);
        break;
      }
      if (position[x][y].startsWith(us)) break;
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Calculates valid moves for a queen piece (combines rook and bishop moves)
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {string} params.piece - The queen piece (e.g., 'wq', 'bq')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[rank, file], ...]
 */
const getQueenMoves = ({ position, piece, rank, file }) => {
  return [
    ...getRookMoves({ position, piece, rank, file }),
    ...getBishopMoves({ position, piece, rank, file })
  ];
};

/**
 * Calculates valid moves for a king piece (one square in any direction)
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {string} params.piece - The king piece (e.g., 'wk', 'bk')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[rank, file], ...]
 */
const getKingMoves = ({ position, piece, rank, file }) => {
  const moves = [];
  const us = piece[0];
  const candidates = [
    [1, 1], [1, 0], [1, -1],
    [0, 1], [0, -1],
    [-1, 1], [-1, 0], [-1, -1]
  ];

  candidates.forEach(([dx, dy]) => {
    const x = rank + dx;
    const y = file + dy;
    if (position?.[x]?.[y] !== undefined && !position[x][y].startsWith(us)) {
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Calculates valid forward moves for a pawn piece (not captures)
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {string} params.piece - The pawn piece (e.g., 'wp', 'bp')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[rank, file], ...]
 */
const getPawnMoves = ({ position, piece, rank, file }) => {
  const moves = [];
  const dir = piece === 'wp' ? 1 : -1;

  if (!position?.[rank + dir]?.[file]) {
    moves.push([rank + dir, file]);
  }
  if (rank % 5 === 1 && !position?.[rank + dir]?.[file] && !position?.[rank + dir + dir]?.[file]) {
    moves.push([rank + dir + dir, file]);
  }

  return moves;
};

/**
 * Calculates valid capture moves for a pawn piece (diagonal attacks and en passant)
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - Current 8x8 board position array
 * @param {Array<Array<string>>} params.prevPosition - Previous board position for en passant detection
 * @param {string} params.piece - The pawn piece (e.g., 'wp', 'bp')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid capture coordinates [[rank, file], ...]
 */
const getPawnCaptures = ({ position, prevPosition, piece, rank, file }) => {
  const moves = [];
  const dir = piece === 'wp' ? 1 : -1;
  const enemy = piece[0] === 'w' ? 'b' : 'w';
  const enemyPawn = dir === 1 ? 'bp' : 'wp';
  const adjacentFiles = [file - 1, file + 1];

  if (position?.[rank + dir]?.[file - 1]?.startsWith(enemy)) {
    moves.push([rank + dir, file - 1]);
  }

  if (position?.[rank + dir]?.[file + 1]?.startsWith(enemy)) {
    moves.push([rank + dir, file + 1]);
  }

  if (prevPosition && ((dir === 1 && rank === 4) || (dir === -1 && rank === 3))) {
    adjacentFiles.forEach(f => {
      if (
        position?.[rank]?.[f] === enemyPawn &&
        position?.[rank + dir + dir]?.[f] === '' &&
        prevPosition?.[rank]?.[f] === '' &&
        prevPosition?.[rank + dir + dir]?.[f] === enemyPawn
      ) {
        moves.push([rank + dir, f]);
      }
    });
  }

  return moves;
};

/**
 * Calculates valid castling moves for a king piece
 * @param {Object} params - Parameters object
 * @param {Array<Array<string>>} params.position - 8x8 board position array
 * @param {string} params.castleDirection - Current castling rights ('both', 'left', 'right', 'none')
 * @param {string} params.piece - The king piece (e.g., 'wk', 'bk')
 * @param {number} params.rank - Current rank (row) position (0-7)
 * @param {number} params.file - Current file (column) position (0-7)
 * @returns {Array<Array<number>>} Array of valid castling coordinates [[rank, file], ...]
 */
const getCastlingMoves = ({ position, castleDirection, piece, rank, file }) => {
  const { arbiter } = require('./Arbiter.jsx');
  const moves = [];

  const isWhite = piece.startsWith('w');
  const baseRank = isWhite ? 0 : 7;
  const player = isWhite ? 'w' : 'b';

  // Handle both object and string formats for castleDirection
  const playerCastleDirection = typeof castleDirection === 'object'
    ? castleDirection[player]
    : castleDirection;

  if (file !== 4 || rank !== baseRank || playerCastleDirection === 'none') return moves;

  if (arbiter.isPlayerInCheck({ positionAfterMove: position, position, player })) return moves;

  if (["left", "both"].includes(playerCastleDirection) &&
    !position[baseRank][3] && !position[baseRank][2] && !position[baseRank][1] &&
    position[baseRank][0] === player + 'r' &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 3 }), player }) &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 2 }), player })
  ) {
    moves.push([baseRank, 2]);
  }

  if (["right", "both"].includes(playerCastleDirection) &&
    !position[baseRank][5] && !position[baseRank][6] &&
    position[baseRank][7] === player + 'r' &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 5 }), player }) &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 6 }), player })
  ) {
    moves.push([baseRank, 6]);
  }

  return moves;
};

/**
 * Determines updated castling rights after a piece move
 * @param {Object} params - Parameters object
 * @param {Object} params.castleDirection - Current castling rights object {w: 'both'|'left'|'right'|'none', b: 'both'|'left'|'right'|'none'}
 * @param {string} params.piece - The piece being moved (e.g., 'wk', 'wr', 'bk', 'br')
 * @param {number} params.file - File (column) position of the moved piece (0-7)
 * @param {number} params.rank - Rank (row) position of the moved piece (0-7)
 * @returns {Object|null} Updated castling direction object {player: string, direction: string} or null if no change
 */
const getCastlingDirections = ({ castleDirection, piece, file, rank }) => {
  rank = Number(rank);
  file = Number(file);
  const player = piece[0];
  const currentDirection = castleDirection[player];

  // If king moves, disable all castling
  if (piece.endsWith('k')) {
    return {
      player: player,
      direction: 'none'
    };
  }

  // If queenside rook (file 0) moves, remove left castling
  if (file === 0 && (rank === 0 || rank === 7)) {
    const newDirection = currentDirection === 'both' ? 'right' : currentDirection === 'left' ? 'none' : currentDirection;
    return {
      player: player,
      direction: newDirection
    };
  }

  // If kingside rook (file 7) moves, remove right castling  
  if (file === 7 && (rank === 0 || rank === 7)) {
    const newDirection = currentDirection === 'both' ? 'left' : currentDirection === 'right' ? 'none' : currentDirection;
    return {
      player: player,
      direction: newDirection
    };
  }

  // No change needed
  return null;
};

/**
 * Finds the position of a player's king on the board
 * @param {Array<Array<string>>} position - 8x8 board position array
 * @param {string} player - Player color ('w' for white, 'b' for black)
 * @returns {Array<number>|null} King position as [rank, file] or null if not found
 */
const getKingPosition = (position, player) => {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (position[x][y].startsWith(player) && position[x][y].endsWith('k')) {
        return [x, y];
      }
    }
  }
  return null;
};

/**
 * Gets all pieces for a specific player from the board
 * @param {Array<Array<string>>} position - 8x8 board position array
 * @param {string} player - Player color ('w' for white, 'b' for black)
 * @returns {Array<Object>} Array of piece objects with {piece: string, rank: number, file: number}
 */
const getPieces = (position, player) => {
  const pieces = [];
  position.forEach((rank, x) => {
    rank.forEach((file, y) => {
      if (position[x][y].startsWith(player)) {
        pieces.push({ piece: position[x][y], rank: x, file: y });
      }
    });
  });
  return pieces;
};

module.exports = {
  getRookMoves,
  getKnightMoves,
  getBishopMoves,
  getQueenMoves,
  getKingMoves,
  getPawnMoves,
  getPawnCaptures,
  getCastlingMoves,
  getCastlingDirections,
  getKingPosition,
  getPieces
};