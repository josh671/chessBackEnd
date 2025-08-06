// Logic for all the pieces and their movements
const { arbiter } = require('./Arbiter.jsx'); // Import arbiter object

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

const getQueenMoves = ({ position, piece, rank, file }) => {
  return [
    ...getRookMoves({ position, piece, rank, file }),
    ...getBishopMoves({ position, piece, rank, file })
  ];
};

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

const getCastlingMoves = ({ position, castleDirection, piece, rank, file }) => {
  const moves = [];

  const isWhite = piece.startsWith('w');
  const baseRank = isWhite ? 0 : 7;
  const player = isWhite ? 'w' : 'b';

  if (file !== 4 || rank !== baseRank || castleDirection === 'none') return moves;

  if (arbiter.isPlayerInCheck({ positionAfterMove: position, position, player })) return moves;

  if (["left", "both"].includes(castleDirection) &&
    !position[baseRank][3] && !position[baseRank][2] && !position[baseRank][1] &&
    position[baseRank][0] === player + 'r' &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 3 }), player }) &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 2 }), player })
  ) {
    moves.push([baseRank, 2]);
  }

  if (["right", "both"].includes(castleDirection) &&
    !position[baseRank][5] && !position[baseRank][6] &&
    position[baseRank][7] === player + 'r' &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 5 }), player }) &&
    !arbiter.isPlayerInCheck({ positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: baseRank, y: 6 }), player })
  ) {
    moves.push([baseRank, 6]);
  }

  return moves;
};

const getCastlingDirections = ({ castleDirection, piece, file, rank }) => {
  rank = Number(rank);
  file = Number(file);
  const direction = castleDirection[piece[0]];

  if (piece.endsWith('k')) return 'none';

  if (file === 0 && (rank === 0 || rank === 7)) {
    return direction === 'both' ? 'right' : direction === 'left' ? 'none' : direction;
  }

  if (file === 7 && (rank === 0 || rank === 7)) {
    return direction === 'both' ? 'left' : direction === 'right' ? 'none' : direction;
  }

  return direction;
};

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