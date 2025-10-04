🔗 Backend Integration

  This frontend connects to a Node.js backend server running on port 3001. Make sure the backend is running before starting the frontend.

  🚀 Available Scripts

  - npm start - Start development server
  - npm run build - Build for production
  - npm test - Run test suite
  - npm run eject - Eject from Create React App

  🤝 Contributing

  Feel free to submit issues and pull requests to improve the game!

  ## Backend README (chessBackEnd/README.md)

  ```markdown
  # ♛ Chess Game Backend Server

  A robust Node.js backend server powering real-time multiplayer chess games. Handles game logic, move validation, room management, and live player
  communication.

  ![Server Architecture](https://via.placeholder.com/800x300/1a1a1a/00ff00?text=Node.js+Socket.IO+Chess+Server)

  ## ⚡ Features

  - 🏠 **Room Management** - Create and join game rooms with unique codes
  - ♔ **Complete Chess Engine** - Full rule validation including special moves
  - 🔄 **Real-time Sync** - Instant move broadcasting between players
  - 🛡️ **Move Validation** - Server-side validation prevents cheating
  - 👥 **Player Management** - Automatic color assignment and turn enforcement
  - 🎯 **Game State Tracking** - Persistent game states across connections
  - 📊 **Live Updates** - Check/checkmate/stalemate detection and broadcasting

  ## 🚀 Quick Start

  ```bash
  # Install dependencies
  npm install

  # Start the server
  node index.js

  # Server runs on http://localhost:3001

  🎮 Game Features

  Core Chess Rules

  - ✅ Piece Movement - All standard piece movements validated
  - ✅ Castling - King and rook castling with proper validation
  - ✅ En Passant - Pawn capture with position history tracking
  - ✅ Pawn Promotion - Interactive promotion to any piece
  - ✅ Check Detection - Real-time check status for both players
  - ✅ Checkmate/Stalemate - Automatic game end detection
  - ✅ Insufficient Material - Draw detection for impossible checkmates

  Multiplayer Features

  - 🎯 Room Codes - Join games with simple room identifiers
  - 👥 Two Player Limit - Automatic room capacity management
  - 🎨 Color Assignment - First player gets white, second gets black
  - 🔄 Turn Enforcement - Server validates it's player's turn before moves
  - 📱 Reconnection Handling - Graceful handling of disconnections

  🏗️ Server Architecture

  chessBackEnd/
  ├── index.js                # Main server with Socket.IO handlers
  ├── Constants.js           # Game state definitions and initial setup
  ├── Board/                 # Chess board logic and helpers
  ├── Arbiters/              # Move validation and game rules
  └── Reducer/               # Game state management actions

  🔌 Socket.IO Events

  Client → Server

  - joinRoom(roomId) - Join a multiplayer game room
  - makeMove(moveData) - Submit a chess move
  - getValidMoves(piece) - Request valid moves for a piece
  - setUpNewGame(roomId) - Start a new game in room
  - promotePawn(promotion) - Select piece for pawn promotion

  Server → Client

  - playerColor({color}) - Assign player white/black
  - board(gameState) - Send initial game setup
  - moveResult({newPosition, turn}) - Broadcast move results
  - checkStatus(status) - Update check/checkmate status
  - validMoves(moves) - Send calculated valid moves
  - openPromotionBox() - Trigger pawn promotion UI
  - roomFull() - Notify when room is at capacity

  🎯 API Endpoints

  GET /                      # Health check endpoint

  🔧 Tech Stack

  - Node.js - JavaScript runtime
  - Express.js - Web framework for HTTP server
  - Socket.IO - Real-time bidirectional communication
  - Chess.js - Chess game logic and validation library
  - CORS - Cross-origin resource sharing configuration

  📊 Game State Management

  The server maintains three key data structures:

  games = {}         // roomId → {board, turn, castleDirection, oldPosition}
  socketRoomMap = {} // socket.id → roomId  
  roomPlayers = {}   // roomId → {w: socketId, b: socketId}

  🛠️ Configuration

  - Port: 3001 (configurable)
  - CORS Origin: http://localhost:3000 (React frontend)
  - Game Logic: Full chess rules with special move support

  🔍 Debugging

  The server includes comprehensive logging for:
  - Player connections and room assignments
  - Move validation and game state changes
  - Check/checkmate detection
  - Error handling and edge cases

  🚀 Deployment

  # Production deployment
  npm install --production
  node index.js

  # Environment variables
  PORT=3001                    # Server port
  CORS_ORIGIN=your-frontend    # Frontend URL for CORS

  🤝 Contributing

  Submit issues and pull requests to help improve the chess engine!
