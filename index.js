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

// Handle client connections
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id)

  // Join a game room
  socket.on('joinRoom', (roomId) => {
    console.log(`📥 Client ${socket.id} is joining room ${roomId}`)

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
    const roomId = socketRoomMap[socket.id]

    if (!roomId) {
      console.log('❌ No room associated with this socket')
      return
    }

    console.log(`♟️ Move received in room ${roomId}:`, move)
    const { piece, rank, file, x, y, currentPosition } = move

    // Perform the move using the arbiter
    const newBoard = arbiter.performMove({
      position: currentPosition,
      piece,
      rank,
      file,
      x,
      y,
    })

    // Update game state
    games[roomId].board = newBoard
    games[roomId].turn = games[roomId].turn === 'w' ? 'b' : 'w'
    games[roomId].oldPosition = currentPosition

    // Send updated board back to all clients in the room
    io.to(roomId).emit('moveResult', {
      newPosition: newBoard,
      turn: games[roomId].turn,
    })
  })

  // Castle update handler 
  socket.on('castlingUpdate', (castleStuff) => {
    const roomId = socketRoomMap[socket.id]

    if (!roomId) {
      console.log('❌ No room associated with this socket')
      return
    }
    

     const direction = getCastlingDirections({
       castleDirection: castleStuff.castleDirection,
       piece: castleStuff.piece, 
       rank: castleStuff.rank, 
       file: castleStuff.file
    })
    
     
     

    io.to(roomId).emit('castlingUpdate', {
      action: direction
    });
  }) 



  socket.on('makePromotion', (promotionStuff) =>{
    //console.log("Promotion stuff", promotionStuff); 
    const roomId = socketRoomMap[socket.id]; 

    if (!roomId) {
      console.log('❌ No room associated with this socket')
      return
    }

    if ((promotionStuff.piece === 'wp' && promotionStuff.x == 7) || (promotionStuff.piece === 'bp' && promotionStuff.x === 0)){
      io.to(roomId).emit('openPromotionBox', {
        action: openPromotion({rank: Number(promotionStuff.rank), file: Number(promotionStuff.file), x: promotionStuff.x, y: promotionStuff.y})

      })
    }

  })



  // Handle disconnect
  socket.on('disconnect', () => {
    const roomId = socketRoomMap[socket.id]
    console.log(`❌ Client disconnected: ${socket.id}`)

    if (roomId) {
      delete socketRoomMap[socket.id]
    }
  })
})

// Start the server
const PORT = 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
