const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const { createPosition } = require('./Board/helper.jsx')
const { arbiter } = require('./Arbiter/Arbiter.jsx')
const { getCastlingDirections } = require('./Arbiter/GetMoves.jsx')
const { updateCastling } = require('./Reducer/Actions/game.jsx')
const { actionTypes } = require('./Reducer/Actions/actionTypes.jsx')
const { emit } = require('process')
const { openPromotion } = require('./Reducer/Actions/popup.jsx')
const { reducer } = require('./Reducer/Actions/move.jsx')

const app = express()

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  }),
)

// Simple test route
app.get('/', (req, res) => {
  res.send('Server is running')
})

// Create HTTP and Socket.IO server
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Game state storage
const games = {} // Maps roomId => game state
const socketRoomMap = {} // Maps socket.id => roomId
const roomPlayers = {} // Maps roomId => { w: socketId, b: socketId }

// Handle client connections
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id)

  // Join a game room
  socket.on('joinRoom', (roomId) => {
    //Assign player Color
    if (!roomPlayers[roomId]) roomPlayers[roomId] = {}
    let color = 'w'

    if (!roomPlayers[roomId].w) {
      roomPlayers[roomId].w = socket.id
      color = 'w'
    } else if (!roomPlayers[roomId].b) {
      roomPlayers[roomId].b = socket.id
      color = 'b'
    } else {
      //Room Full
      socket.emit('roomFull')
      return
    }
    //console.log('color', {color});
    socket.emit('playerColor', { color })
    console.log('roomPlayers:', JSON.stringify(roomPlayers, null, 2))
    console.log(
      `📥 Client ${socket.id} is joining room ${roomId} and color is ${color}`,
    )

    // Initialize game state for room if not already created
    if (!games[roomId]) {
      games[roomId] = {
        board: createPosition(), // starting board
        turn: 'w', // white starts
        castleDirection: { w: {}, b: {} },
      }
    }

    socket.join(roomId)
    socketRoomMap[socket.id] = roomId

    // Send initial game state to this client
    socket.emit('board', {
      board: games[roomId].board,
      turn: games[roomId].turn,
    })
  })

  // Handle move from a client
  socket.on('makeMove', (move) => {
    //console.log('♟️ Move received:', move)
    const roomId = socketRoomMap[socket.id]

    if (!roomId) {
      console.log('❌ No room associated with this socket')
      return
    }
    //Only allow move if it's this players turn
    const currentTurn = games[roomId].turn
    const playerColor = Object.entries(roomPlayers[roomId]).find(
      ([color, id]) => id === socket.id,
    )?.[0]

    if (playerColor !== currentTurn) {
      socket.emit('invalidMove', { reason: 'Not your turn!' })
      return
    }

    //console.log(`♟️ Move received in room ${roomId}:`, move)
    const { piece, rank, file, x, y, currentPosition } = move

    // Perform the move using the arbiter
    let newBoard = arbiter.performMove({
      position: currentPosition,
      piece,
      rank,
      file,
      x,
      y,
    })
    const opponent = move.opponent

    const castleDirection = getCastlingDirections({
      castleDirection: move.castleDirection,
      piece: move.piece,
      rank: move.rank,
      file: move.file,
    })
    if (castleDirection) {
      io.to(roomId).emit('castlingUpdate', {
        action: castleDirection,
      })
    }

    const isInCheck = arbiter.isPlayerInCheck({
      positionAfterMove: newBoard,
      position: currentPosition,
      player: opponent,
    })

    // returns true because it is in checkmate
    if (
      arbiter.isCheckMate(
        newBoard,
        opponent,
        castleDirection,
        piece,
        rank,
        file,
      )
    ) {
      //kind of works if using opponent instead of piece

      io.to(roomId).emit('isCheckMate', move.piece)
    }

    // socket.on('promotePawn', (promotion) =>{

    //   console.log('Promotion received:', promotion);
    //   const newBoard = arbiter.performMove({
    //     position: promotion.newPosition,
    //     piece: promotion.piece,
    //     rank: promotion.rank,
    //     file: promotion.file,
    //     x: promotion.x,
    //     y: promotion.y
    //         })
    //       console.log('turn after promotion', games[roomId].turn );
    //   io.to(roomId).emit('moveResult', {
    //     newPosition: newBoard,
    //     turn: games[roomId].turn,

    // })
    // })

    if ((piece === 'wp' && x == 7) || (piece === 'bp' && x === 0)) {
      socket.emit('openPromotionBox', {
        action: openPromotion({
          rank: Number(rank),
          file: Number(file),
          x: x,
          y: y,
        }),
      })
      socket.on('promotePawn', (promotion) => {
        console.log('Promotion received:', promotion)
        newBoard = arbiter.performMove({
          position: promotion.newPosition,
          piece: promotion.piece,
          rank: promotion.rank,
          file: promotion.file,
          x: promotion.x,
          y: promotion.y,
        })
        newBoard[rank][file] = ''
        newBoard[x][y] = promotion.piece
        games[roomId].board = newBoard
        io.to(roomId).emit('moveResult', {
          newPosition: newBoard,
          turn: games[roomId].turn,
        })
        return
      })
    }

    console.log('turn before update', games[roomId].board)

    // Update game state
    games[roomId].board = newBoard
    console.log('games[roomId].turn', games[roomId].turn)
    games[roomId].turn = games[roomId].turn === 'w' ? 'b' : 'w'
    games[roomId].oldPosition = currentPosition

    // Send updated board back to all clients in the room
    io.to(roomId).emit('moveResult', {
      newPosition: newBoard,
      turn: games[roomId].turn,
    })
  })

  // socket.on('makePromotion', (promotionStuff) =>{
  //   //console.log("Promotion stuff", promotionStuff);
  //   const roomId = socketRoomMap[socket.id];

  //   if (!roomId) {
  //     console.log('❌ No room associated with this socket')
  //     return
  //   }

  //   if ((promotionStuff.piece === 'wp' && promotionStuff.x == 7) || (promotionStuff.piece === 'bp' && promotionStuff.x === 0)){
  //     socket.emit('openPromotionBox', {
  //       action: openPromotion({rank: Number(promotionStuff.rank), file: Number(promotionStuff.file), x: promotionStuff.x, y: promotionStuff.y})

  //     })
  //   }

  // })

  // Handle disconnect
  socket.on('disconnect', () => {
    const roomId = socketRoomMap[socket.id]
    if (roomId && roomPlayers[roomId]) {
      if (roomPlayers[roomId].w === socket.id) delete roomPlayers[roomId].w
      if (roomPlayers[roomId].b === socket.id) delete roomPlayers[roomId].b
      if (Object.keys(roomPlayers[roomId]).length === 0)
        delete roomPlayers[roomId]
    }
    if (roomId) delete socketRoomMap[socket.id]
  })
})

// Start the server
const PORT = 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
