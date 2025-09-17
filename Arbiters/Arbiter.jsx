/**
 * Chess Arbiter - Main chess rules engine
 * Handles move validation, game state analysis, and special conditions
 */

// Import chess move calculation functions
const {
  getRookMoves,
  getKnightMoves,
  getBishopMoves,
  getQueenMoves,
  getKingMoves,
  getPawnMoves,
  getPawnCaptures,
  getCastlingMoves,
  getKingPosition,
  getPieces,
  findPieceCoords,
  areSameColorTiles,
} = require('./GetMoves.jsx');

// Import move execution functions
const {movePawn, movePiece} = require('./Move.jsx');

/**
 * Chess game arbiter object containing all rule validation and game logic
 */
const arbiter = {
  /**
   * Get regular (non-special) moves for a chess piece
   * @param {Array} position - Current board state (8x8 array)
   * @param {string} piece - Piece notation (e.g., 'wp', 'bk')
   * @param {number} rank - Current rank (0-7)
   * @param {number} file - Current file (0-7)
   * @returns {Array} Array of possible moves [[rank, file], ...]
   */
  getRegularMoves: function({position, piece, rank, file}) {
    if (piece.endsWith('r'))
      return getRookMoves({position, piece, rank, file});
    if (piece.endsWith('n'))
      return getKnightMoves({position, rank, file});
    if (piece.endsWith('b'))
      return getBishopMoves({position, piece, rank, file});
    if (piece.endsWith('q'))
      return getQueenMoves({position, piece, rank, file});
    if (piece.endsWith('k'))
      return getKingMoves({position, piece, rank, file});
    if (piece.endsWith('p'))
      return [...getPawnMoves({position, piece, rank, file})];
    return [];
  },

  /**
   * Get all valid (legal) moves for a piece, filtering out moves that leave king in check
   * @param {Array} position - Current board state
   * @param {Object} castleDirection - Castling rights {w: 'both'|'left'|'right'|'none', b: ...}
   * @param {Array} prevPosition - Previous board state (for en passant)
   * @param {string} piece - Piece notation
   * @param {number} rank - Current rank
   * @param {number} file - Current file
   * @returns {Array} Array of legal moves that don't leave king in check
   */
  getValidMoves: function({position, castleDirection, prevPosition, piece, rank, file}) {
    let moves = this.getRegularMoves({position, piece, rank, file});
    const notInCheckMoves = [];

    // Add special pawn captures (including en passant)
    if (piece.endsWith('p')) {
      moves = moves.concat(
        getPawnCaptures({position, prevPosition, piece, rank, file})
      );
    }

    // Add castling moves for king
    if (piece.endsWith('k')) {
      moves = moves.concat(
        getCastlingMoves({position, castleDirection, piece, rank, file})
      );
    }

    // Filter out moves that would leave own king in check
    moves.forEach(([x, y]) => {
      const positionAfterMove = this.performMove({position, piece, rank, file, x, y});
      if (!this.isPlayerInCheck({positionAfterMove, position, player: piece[0]})) {
        notInCheckMoves.push([x, y]);
      }
    });

    return notInCheckMoves;
  },

  /**
   * Execute a chess move and return the new board state
   * @param {Array} position - Current board state
   * @param {string} piece - Piece being moved
   * @param {number} rank - Starting rank
   * @param {number} file - Starting file
   * @param {number} x - Destination rank
   * @param {number} y - Destination file
   * @returns {Array} New board state after move
   */
  performMove: function({position, piece, rank, file, x, y}) {
    if (piece.endsWith('p')) {
      return movePawn({position, piece, rank, file, x, y});
    } else {
      return movePiece({position, piece, rank, file, x, y});
    }
  },

  /**
   * Check if a player's king is in check
   * @param {Array} positionAfterMove - Board state to check
   * @param {Array} position - Previous board state (for en passant context)
   * @param {string} player - Player color ('w' or 'b')
   * @returns {boolean} True if player's king is under attack
   */
  isPlayerInCheck: function({positionAfterMove, position, player}) {
    const enemy = player === 'w' ? 'b' : 'w';

    // Find king position on the board
    let kingPosition = getKingPosition(positionAfterMove, player);
    const enemyPieces = getPieces(positionAfterMove, enemy);

    // Get all possible enemy moves
    const enemyMoves = enemyPieces.reduce((acc, p) => acc.concat(
      p.piece.endsWith('p')
        ? getPawnCaptures({position: positionAfterMove, prevPosition: position, ...p})
        : this.getRegularMoves({position: positionAfterMove, ...p})
    ), []);

    // Check if any enemy move can capture the king
    return enemyMoves.some(([x, y]) => kingPosition[0] === x && kingPosition[1] === y);
  },

  /**
   * Check if the game is in stalemate (player not in check but has no legal moves)
   * @param {Array} position - Current board state
   * @param {string} player - Player color to check
   * @param {Object} castleDirection - Castling rights
   * @returns {boolean} True if stalemate condition exists
   */
  isStalemate: function(position, player, castleDirection) {
    // If player is in check, it can't be stalemate
    const isInCheck = this.isPlayerInCheck({positionAfterMove: position, player});
    if (isInCheck) return false;

    // Get all pieces for this player
    const pieces = getPieces(position, player);

    // Check if player has any legal moves
    const moves = pieces.reduce((acc, p) => acc.concat(
      this.getValidMoves({position, castleDirection, ...p})
    ), []);

    // Stalemate if no legal moves available
    return moves.length === 0;
  },

  /**
   * Check if there is insufficient material to continue the game (automatic draw)
   * @param {Array} position - Current board state
   * @returns {boolean} True if insufficient material for checkmate exists
   * Covers: K vs K, K+N vs K, K+B vs K, K+B vs K+B (same color squares)
   */
  insufficientMaterial: function(position) {
    //console.log(position);

    // Get all pieces on the board
    const pieces = position.reduce((acc, rank) =>
      acc.concat(rank.filter(x => x)), []
    );

    // King vs King
    if (pieces.length === 2) return true;

    // King + Knight vs King, or King + Bishop vs King
    if (pieces.length === 3 && (pieces.some(p => p.endsWith('n')) || pieces.some(p => p.endsWith('b')))) return true;

    // King + Bishop vs King + Bishop (both bishops on same color squares)
    if (
      pieces.length === 4 &&
      pieces.every(p => p.endsWith('b') || p.endsWith('k')) &&
      new Set(pieces).size === 4 &&
      areSameColorTiles(
        findPieceCoords(position, 'wb')[0],
        findPieceCoords(position, 'bb')[0],
      )
    ) {
      return true;
    }

    return false;
  },

  /**
   * Check if the game is in checkmate (player in check with no legal moves)
   * @param {Array} position - Current board state
   * @param {string} player - Player color to check
   * @param {Object} castleDirection - Castling rights
   * @param {string} piece - Last moved piece (for context)
   * @param {number} rank - Last move rank (for context)
   * @param {number} file - Last move file (for context)
   * @returns {boolean} True if checkmate condition exists
   */
  isCheckMate: function(position, player, castleDirection, piece, rank, file) {
    // Must be in check for checkmate
    const isInCheck = this.isPlayerInCheck({positionAfterMove: position, player});
    if (!isInCheck) return false;

    // Get all pieces for this player
    const pieces = getPieces(position, player);

    // Check if player has any legal moves to escape check
    const moves = pieces.reduce((acc, p) => acc.concat(
      this.getValidMoves({
        position,
        castleDirection,
        prevPosition: position,
        ...p
      })
    ), []);

    // Checkmate if no legal moves available while in check
    return moves.length === 0;
  },
};

module.exports = { arbiter };
