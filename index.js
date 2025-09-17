// Chess Game Backend Server
// Handles multiplayer chess game logic, socket connections, and game state management

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

// Import chess game logic modules
const { createPosition, getCurrentMoveNotation } = require('./Board/helper.jsx')
const { arbiter } = require('./Arbiters/Arbiter.jsx')
const { getCastlingDirections, getKingPosition } = require('./Arbiters/GetMoves.jsx')
const { updateCastling } = require('./Reducer/Actions/game.jsx')
const { actionTypes } = require('./Reducer/Actions/actionTypes.jsx')
const { emit } = require('process')
const { openPromotion } = require('./Reducer/Actions/popup.jsx')
const { reducer } = require('./Reducer/Actions/move.jsx')
const { detectCheckMate } = require('./Reducer/Actions/game.jsx')
const { initGameState } = require('./Constants.js')
const { detectInsufficientMaterial } = require('./Reducer/Actions/game.jsx')


// Create Express application
const app = express()

// Configure CORS middleware to allow requests from React frontend
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  }),
)

/**
 * Simple health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {string} Simple status message
 */
app.get('/', (req, res) => {
  res.send('Server is running')
})

// Create HTTP server and Socket.IO server with CORS configuration
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Game state storage objects
const games = {}         // Maps roomId => { board, turn, castleDirection, oldPosition }
const socketRoomMap = {} // Maps socket.id => roomId (for tracking which room each socket is in)
const roomPlayers = {}   // Maps roomId => { w: socketId, b: socketId } (player assignments)

// Handle new client socket connections
io.on('connection', (socket) => {
  // console.log('✅ New client connected:', socket.id)

  /**
   * Handle player joining a game room
   * @param {string} roomId - Unique identifier for the game room
   * Assigns player colors (white/black), initializes game state, and sends initial board
   */
  socket.on('joinRoom', (roomId) => {
    // Initialize room players object if it doesn't exist
    if (!roomPlayers[roomId]) roomPlayers[roomId] = {}
    let color = 'w'

    // Assign player color based on availability
    if (!roomPlayers[roomId].w) {
      roomPlayers[roomId].w = socket.id
      color = 'w'
    } else if (!roomPlayers[roomId].b) {
      roomPlayers[roomId].b = socket.id
      color = 'b'
    } else {
      // Room is full, reject the connection
      socket.emit('roomFull')
      return
    }

    // Notify client of their assigned color
    socket.emit('playerColor', { color })
    console.log('roomPlayers:', JSON.stringify(roomPlayers, null, 2))
    console.log(
      `📥 Client ${socket.id} is joining room ${roomId} and color is ${color}`,
    )

    // Initialize game state for new rooms
    if (!games[roomId]) {
      games[roomId] = {
        board: createPosition(),                    // Starting chess position
        turn: 'w',                                 // White moves first
        castleDirection: { w: 'both', b: 'both' } // Both sides can castle initially
      }
    }

    // Add socket to room and track the mapping
    socket.join(roomId)
    socketRoomMap[socket.id] = roomId

    // Send initial game state to the newly joined client
    socket.emit('board', {
      type: actionTypes.NEW_GAME,
      payload: initGameState,
    })
  })

  /**
   * Handle chess move from a client
   * @param {Object} move - Move object containing piece, position, and destination
   * @param {string} move.piece - Chess piece notation (e.g., 'wp', 'bk')
   * @param {number} move.rank - Starting rank (0-7)
   * @param {number} move.file - Starting file (0-7)
   * @param {number} move.x - Destination rank (0-7)
   * @param {number} move.y - Destination file (0-7)
   * @param {Array} move.currentPosition - Current board state
   * @param {string} move.opponent - Opponent player color ('w' or 'b')
   * Validates move, updates game state, checks for special conditions, and broadcasts results
   */
  socket.on('makeMove', (move) => {
    const roomId = socketRoomMap[socket.id]

    // Validate that socket is associated with a room
    if (!roomId) {
      // console.log('❌ No room associated with this socket')
      return
    }

    // Validate it's the player's turn
    const currentTurn = games[roomId].turn
    const playerColor = Object.entries(roomPlayers[roomId]).find(
      ([color, id]) => id === socket.id,
    )?.[0]

    if (playerColor !== currentTurn) {
      socket.emit('invalidMove', { reason: 'Not your turn!' })
      return
    }

    // Extract move parameters
    const { piece, rank, file, x, y, currentPosition } = move

    // Execute the move using the chess arbiter
    let newBoard = arbiter.performMove({
      position: currentPosition,
      piece,
      rank,
      file,
      x,
      y,
    })
    const opponent = move.opponent

    // Check if move affects castling rights
    const castleDirection = getCastlingDirections({
      castleDirection: move.castleDirection,
      piece: move.piece,
      rank: move.rank,
      file: move.file,
    })
    if (castleDirection) {
      // Update server game state with new castling restrictions
      if (!games[roomId].castleDirection) {
        games[roomId].castleDirection = { w: 'both', b: 'both' };
      }
      games[roomId].castleDirection[castleDirection.player] = castleDirection.direction;

      // Notify all clients of castling rights change
      io.to(roomId).emit('castlingUpdate', {
        type: actionTypes.CAN_CASTLE,
        payload: castleDirection,
      })
    }

    // Check if opponent is in check after the move
    const isInCheck = arbiter.isPlayerInCheck({
      positionAfterMove: newBoard,
      position: currentPosition,
      player: opponent,
    })

    // Calculate check status for both players after the move
    const whiteInCheck = arbiter.isPlayerInCheck({
      positionAfterMove: newBoard,
      position: currentPosition,
      player: 'w',
    });

    const blackInCheck = arbiter.isPlayerInCheck({
      positionAfterMove: newBoard,
      position: currentPosition,
      player: 'b',
    });

    // Prepare check status data for both players
    const checkStatus = {
      white: {
        isInCheck: whiteInCheck,
        kingPosition: whiteInCheck ? getKingPosition(newBoard, 'w') : null
      },
      black: {
        isInCheck: blackInCheck,
        kingPosition: blackInCheck ? getKingPosition(newBoard, 'b') : null
      },
      turn: opponent // Next player's turn
    };

    // Broadcast check status to all players in room
    io.to(roomId).emit('checkStatus', checkStatus);

    // Check for insufficient material (automatic draw)
    if(arbiter.insufficientMaterial(newBoard)){
      io.to(roomId).emit('insufficientMaterial', {
        type: actionTypes.INSUFFICIENT_MATERIAL,
      })
    }

    // Check for checkmate
    if (
      arbiter.isCheckMate(
        newBoard,
        opponent,
        games[roomId].castleDirection,
        piece,
        rank,
        file,
      )
    ) {
      io.to(roomId).emit('isCheckMate', ({type: actionTypes.WIN, payload: move.piece[0]}))
    }


    // Handle pawn promotion (when pawn reaches opposite end of board)
    if ((piece === 'wp' && x == 7) || (piece === 'bp' && x === 0)) {
      const promotingPlayer = piece[0]; // Extract player color ('w' or 'b')

      // Notify all players that promotion is occurring
      io.to(roomId).emit('promotionStatus', {
        type: 'SET_PROMOTION_STATUS',
        payload: {
          isPromoting: true,
          promotingPlayer: promotingPlayer
        }
      });

      // Send promotion UI popup only to the promoting player
      socket.emit('openPromotionBox', {
        action: openPromotion({
          rank: Number(rank),
          file: Number(file),
          x: x,
          y: y,
        }),
      })
      /**
       * Handle pawn promotion piece selection
       * @param {Object} promotion - Promotion data
       * @param {string} promotion.piece - Selected promotion piece (e.g., 'wq', 'wr')
       * @param {Array} promotion.newPosition - Board state after promotion
       * Updates board with promoted piece and broadcasts result
       */
      socket.on('promotePawn', (promotion) => {
        // console.log('Promotion received:', promotion)

        // Perform the promotion move
        newBoard = arbiter.performMove({
          position: promotion.newPosition,
          piece: promotion.piece,
          rank: promotion.rank,
          file: promotion.file,
          x: promotion.x,
          y: promotion.y,
        })

        // Clear original pawn position and place promoted piece
        newBoard[rank][file] = ''
        newBoard[x][y] = promotion.piece
        games[roomId].board = newBoard

        // Broadcast updated board to all players
        io.to(roomId).emit('moveResult', {
          newPosition: newBoard,
          turn: games[roomId].turn,
        })

        // Clear promotion status after completion
        io.to(roomId).emit('promotionStatus', {
          type: 'SET_PROMOTION_STATUS',
          payload: {
            isPromoting: false,
            promotingPlayer: null
          }
        });

        return
      })
    }

    // console.log('turn before update', games[roomId].board)

    // Update server game state with move results
    games[roomId].board = newBoard                                      // New board position
    // console.log('games[roomId].turn', games[roomId].turn)
    games[roomId].turn = games[roomId].turn === 'w' ? 'b' : 'w'        // Switch turns
    games[roomId].oldPosition = currentPosition                         // Store previous position for en passant

  //Here is new move notation 
  console.log('here is what is being sent from the front end', piece, rank, file, x, y); 
  const currentMoveNotation =  getCurrentMoveNotation(piece, rank, file, x, y)
   
  io.to(roomId).emit('pastMoves', {
    currentMoveNotation, 
  })


    // Broadcast move result to all players in the room
    io.to(roomId).emit('moveResult', {
      newPosition: newBoard,
      turn: games[roomId].turn,
    })
  })


  /**
   * Handle request for valid moves calculation
   * @param {Object} moveRequest - Request for valid moves
   * @param {string} moveRequest.piece - Chess piece notation
   * @param {number} moveRequest.rank - Piece's current rank
   * @param {number} moveRequest.file - Piece's current file
   * @param {Array} moveRequest.position - Current board state
   * Calculates and returns all legal moves for the specified piece
   */
  socket.on('getValidMoves', (moveRequest) => {
    // console.log('♟️ Valid moves requested:', moveRequest);
    const roomId = socketRoomMap[socket.id];

    // Validate room and game exist
    if (!roomId || !games[roomId]) {
      // console.log('❌ No room/game found for valid moves request');
      return;
    }

    const { piece, rank, file, position, castleDirection } = moveRequest;

    // Calculate all legal moves using chess rules engine
    const validMoves = arbiter.getValidMoves({
      position: position,
      prevPosition: games[roomId].oldPosition,
      castleDirection: games[roomId].castleDirection,
      piece,
      rank,
      file
    });

    // Send calculated moves back to requesting client
    socket.emit('validMoves', {
      piece,
      rank,
      file,
      validMoves
    });
  });

  /**
   * Handle new game setup request
   * @param {Object} newGame - New game configuration
   * @param {string} newGame.roomId - Room to reset
   * Resets game state to initial position and notifies all players
   */
  socket.on('setUpNewGame', (newGame) => {
     const roomId = newGame.roomId;
     // console.log('Setting up new game in room', roomId);

     // Validate roomId is provided
     if(!roomId){
        // console.log('No roomId provided for new game setup');
        return;
      }

      // Reset game state to initial position
      games[roomId] = {
        board: createPosition(),                    // Starting chess position
        turn: 'w',                                 // White moves first
        castleDirection: { w: 'both', b: 'both' } // Reset castling rights
      }

      // Notify all players in room of new game
      io.to(roomId).emit('newGame', {
        type: actionTypes.NEW_GAME,
        payload: initGameState,
      })

      // Close any open popups
      io.to(roomId).emit('closePopup', {
        type: actionTypes.CLOSE_POPUP,
      })
  })




  /**
   * Handle client disconnection
   * Cleans up player assignments and room mappings when a client leaves
   */
  socket.on('disconnect', () => {
    const roomId = socketRoomMap[socket.id]

    // Remove player from room assignments
    if (roomId && roomPlayers[roomId]) {
      if (roomPlayers[roomId].w === socket.id) delete roomPlayers[roomId].w
      if (roomPlayers[roomId].b === socket.id) delete roomPlayers[roomId].b

      // Clean up empty room
      if (Object.keys(roomPlayers[roomId]).length === 0)
        delete roomPlayers[roomId]
    }

    // Remove socket from room mapping
    if (roomId) delete socketRoomMap[socket.id]
  })
})

/**
 * Start the HTTP server
 * Listens on port 3001 for incoming connections
 */
const PORT = 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
