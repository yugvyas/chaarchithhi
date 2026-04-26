const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

// Game State (In-Memory for now)
const rooms = {};

// Helper: Generate Room Code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ playerName }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      roomCode,
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName, chithhiName: null }],
      status: 'lobby', // lobby, playing, finished
      roundsTotal: 1, // Default, could be configurable
      roundsCurrent: 0,
      deck: [],
      hands: {},
      currentTurn: null,
      passCount: 0,
      maxPasses: 0,
      turnOrder: [],
      slaps: []
    };
    socket.join(roomCode);
    socket.emit('room_created', { roomCode, hostId: socket.id, players: rooms[roomCode].players });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (room) {
      if (room.status !== 'lobby') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }
      room.players.push({ id: socket.id, name: playerName, chithhiName: null });
      socket.join(roomCode);
      io.to(roomCode).emit('player_joined', { players: room.players });
      console.log(`${playerName} joined ${roomCode}`);
    } else {
      socket.emit('error', { message: 'Invalid room code' });
    }
  });

  // Set Chithhi Name
  socket.on('set_chithhi_name', ({ roomCode, chithhiName }) => {
    const room = rooms[roomCode];
    if (room) {
      // Check for duplicates
      const isDuplicate = room.players.some(p => p.chithhiName && p.chithhiName.toLowerCase() === chithhiName.toLowerCase());
      if (isDuplicate) {
        socket.emit('error', { message: 'Chithhi name already taken in this room' });
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.chithhiName = chithhiName;
        io.to(roomCode).emit('player_updated', { players: room.players });
      }
    }
  });

  // Start Game
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.hostId === socket.id) {
      // Check if all players set chithhi name
      const allNamesSet = room.players.every(p => p.chithhiName);
      if (!allNamesSet) {
        socket.emit('error', { message: 'All players must set their Chithhi names' });
        return;
      }

      room.status = 'playing';
      room.roundsCurrent = 1;
      room.turnOrder = room.players.map(p => p.id);
      room.currentTurn = room.turnOrder[0];
      room.maxPasses = room.players.length * 10;
      room.passCount = 0;
      room.slaps = [];

      // Create deck (4 of each player's chithhi name)
      room.deck = [];
      room.players.forEach((p, index) => {
        for (let i = 0; i < 4; i++) {
          room.deck.push({ id: `c_${index}_${i}`, name: p.chithhiName, ownedBy: p.id });
        }
      });

      // Shuffle deck
      for (let i = room.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.deck[i], room.deck[j]] = [room.deck[j], room.deck[i]];
      }

      // Deal 4 to each
      room.players.forEach(p => {
        room.hands[p.id] = room.deck.splice(0, 4);
      });

      // Send individual hands inside game_started
      room.players.forEach(p => {
        io.to(p.id).emit('game_started', {
          status: room.status,
          turnOrder: room.turnOrder,
          currentTurn: room.currentTurn,
          maxPasses: room.maxPasses,
          hand: room.hands[p.id]
        });
      });
      
      io.to(roomCode).emit('turn_start', { playerId: room.currentTurn, passCount: room.passCount });
    }
  });

  // Pass Card
  socket.on('pass_card', ({ roomCode, cardId }) => {
    const room = rooms[roomCode];
    if (room && room.currentTurn === socket.id) {
       const playerHand = room.hands[socket.id];
       const cardIndex = playerHand.findIndex(c => c.id === cardId);
       
       if (cardIndex !== -1) {
         const passedCard = playerHand.splice(cardIndex, 1)[0];
         
         // Find next player
         const currentIndex = room.turnOrder.indexOf(socket.id);
         const nextIndex = (currentIndex + 1) % room.turnOrder.length;
         const nextPlayerId = room.turnOrder[nextIndex];
         
         // Add card to next player's hand
         room.hands[nextPlayerId].push(passedCard);
         
         room.passCount++;
         room.currentTurn = nextPlayerId;

         // Emit updates
         io.to(roomCode).emit('card_passed', { from: socket.id, to: nextPlayerId, passCount: room.passCount });
         
         // Update hands for sender and receiver
         io.to(socket.id).emit('your_hand', { hand: room.hands[socket.id] });
         io.to(nextPlayerId).emit('your_hand', { hand: room.hands[nextPlayerId] });
         
         if (room.passCount >= room.maxPasses) {
            // Stalemate
            endRound(roomCode, null);
         } else {
            io.to(roomCode).emit('turn_start', { playerId: room.currentTurn, passCount: room.passCount });
         }
       }
    }
  });

  // Trigger Dhappa
  socket.on('trigger_dhappa', ({ roomCode }) => {
     const room = rooms[roomCode];
     if (room && room.currentTurn === socket.id) {
         // Validate dhappa (4 matching cards)
         const hand = room.hands[socket.id];
         const nameCounts = {};
         hand.forEach(c => {
             nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
         });
         
         const hasDhappa = Object.values(nameCounts).some(count => count >= 4);
         
         if (hasDhappa) {
             io.to(roomCode).emit('dhappa_triggered', { by: socket.id });
             room.slaps = [{ playerId: socket.id, timestamp: 0 }]; // Dhappa player is automatic first
             
             // Auto-close slap window after 3 seconds
             setTimeout(() => {
                 calculateScoresAndEndRound(roomCode);
             }, 3000);
         }
     }
  });

  // Register Slap
  socket.on('register_slap', ({ roomCode, timestamp }) => {
     const room = rooms[roomCode];
     if (room) {
         // Check if they already slapped
         if (!room.slaps.some(s => s.playerId === socket.id)) {
             room.slaps.push({ playerId: socket.id, timestamp });
         }
     }
  });

  const calculateScoresAndEndRound = (roomCode) => {
      const room = rooms[roomCode];
      if (!room || room.status !== 'slappad') return;
      
      // Sort slaps by timestamp
      // Dhappa player is index 0 with timestamp 0
      const slaps = room.slaps.sort((a, b) => a.timestamp - b.timestamp);
      
      const numPlayers = room.players.length;
      let scores = {};
      
      const scoringTable = {
          2: [1000, 0],
          3: [1000, 500, 0],
          4: [1000, 500, 250, 0],
          5: [1000, 750, 500, 250, 0],
          6: [1000, 800, 600, 400, 200, 0]
      };
      
      const roundScores = scoringTable[numPlayers] || [1000, ...Array(numPlayers-1).fill(0)];
      
      // Assign scores based on slap order
      slaps.forEach((slap, index) => {
          if (index < roundScores.length) {
            scores[slap.playerId] = roundScores[index];
          } else {
            scores[slap.playerId] = 0;
          }
      });
      
      // Anyone who didn't slap gets 0
      room.players.forEach(p => {
          if (scores[p.id] === undefined) {
              scores[p.id] = 0;
          }
          
          // Add to player's total score object (initialize if needed)
          if (!p.score) p.score = { round: 0, total: 0 };
          p.score.round = scores[p.id];
          p.score.total += scores[p.id];
      });

      io.to(roomCode).emit('round_end', { 
          scores, 
          players: room.players,
          slapOrder: slaps.map(s => s.playerId)
      });
  };

  const endRound = (roomCode, dhappaPlayerId) => {
      // Logic handled in calculateScoresAndEndRound mostly
      // This is for stalemate
      if (dhappaPlayerId === null) {
          const room = rooms[roomCode];
          if(room) {
             room.players.forEach(p => {
                if (!p.score) p.score = { round: 0, total: 0 };
                p.score.round = 0;
             });
             io.to(roomCode).emit('round_end', {
                 scores: {},
                 players: room.players,
                 stalemate: true
             });
          }
      }
  };

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Handle disconnects later
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
