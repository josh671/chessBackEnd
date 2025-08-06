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
} = require('./GetMoves.jsx');  // no .jsx extension

const {movePawn, movePiece} = require('./Move.jsx'); 

const arbiter = {
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

  getValidMoves: function({position, castleDirection, prevPosition, piece, rank, file}) {
    let moves = this.getRegularMoves({position, piece, rank, file});
    const notInCheckMoves = [];

    if (piece.endsWith('p')) {
      moves = moves.concat(
        getPawnCaptures({position, prevPosition, piece, rank, file})
      );
    }

    if (piece.endsWith('k')) {
      moves = moves.concat(
        getCastlingMoves({position, castleDirection, piece, rank, file})
      );
    }

    moves.forEach(([x, y]) => {
      const positionAfterMove = this.performMove({position, piece, rank, file, x, y});
      if (!this.isPlayerInCheck({positionAfterMove, position, player: piece[0]})) {
        notInCheckMoves.push([x, y]);
      }
    });

    return notInCheckMoves;
  },

  performMove: function({position, piece, rank, file, x, y}) {
    if (piece.endsWith('p')) {
      return  movePawn({position, piece, rank, file, x, y});
    } else {
      return movePiece({position, piece, rank, file, x, y});
    }
  },

  isPlayerInCheck: function({positionAfterMove, position, player}) {
    const enemy = player === 'w' ? 'b' : 'w';

    let kingPosition = getKingPosition(positionAfterMove, player);
    const enemyPieces = getPieces(positionAfterMove, enemy);

    const enemyMoves = enemyPieces.reduce((acc, p) => acc.concat(
      p.piece.endsWith('p')
        ? getPawnCaptures({position: positionAfterMove, prevPosition: position, ...p})
        : this.getRegularMoves({position: positionAfterMove, ...p})
    ), []);

    return enemyMoves.some(([x, y]) => kingPosition[0] === x && kingPosition[1] === y);
  },

  isStalemate: function(position, player, castleDirection) {
    const isInCheck = this.isPlayerInCheck({positionAfterMove: position, player});
    if (isInCheck) return false;

    const pieces = getPieces(position, player);
    const moves = pieces.reduce((acc, p) => acc.concat(
      this.getValidMoves({position, castleDirection, ...p})
    ), []);

    return moves.length === 0;
  },

  insufficientMaterial: function(position) {
    const pieces = position.reduce((acc, rank) =>
      acc.concat(rank.filter(x => x)), []
    );

    if (pieces.length === 2) return true;
    if (pieces.length === 3 && (pieces.some(p => p.endsWith('n')) || pieces.some(p => p.endsWith('b')))) return true;

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

  isCheckMate: function(position, player, castleDirection) {
    const isInCheck = this.isPlayerInCheck({positionAfterMove: position, player});
    if (!isInCheck) return false;

    const pieces = getPieces(position, player);
    const moves = pieces.reduce((acc, p) => acc.concat(
      this.getValidMoves({position, castleDirection, ...p})
    ), []);

    return moves.length === 0;
  },
};

module.exports = { arbiter };
