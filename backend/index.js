const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Game State (In-Memory)
const rooms = {};

// Helper: Generate Room Code
const generateRoomCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// Helper: Clean up empty room
const cleanupRoom = (roomCode) => {
  delete rooms[roomCode];
  console.log(`Room ${roomCode} cleaned up`);
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // ─── Create Room ─────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      roomCode,
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName, chithhiName: null }],
      status: 'lobby',
      roundsTotal: 3,       // configurable – default 3 rounds
      roundsCurrent: 0,
      deck: [],
      hands: {},
      currentTurn: null,
      passCount: 0,
      maxPasses: 0,
      turnOrder: [],
      slaps: [],
    };
    socket.join(roomCode);
    socket.emit('room_created', {
      roomCode,
      hostId: socket.id,
      players: rooms[roomCode].players,
    });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // ─── Join Room ────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', { message: 'Invalid room code' });
      return;
    }
    if (room.status !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }
    if (room.players.length >= 6) {
      socket.emit('error', { message: 'Room is full (max 6 players)' });
      return;
    }

    room.players.push({ id: socket.id, name: playerName, chithhiName: null });
    socket.join(roomCode);

    // FIX #4: Send 'room_joined' only to the new joiner (not broadcast)
    socket.emit('room_joined', {
      roomCode,
      hostId: room.hostId,
      players: room.players,
      playerName,
    });

    // Notify everyone ELSE in the room that a new player joined
    socket.to(roomCode).emit('player_joined', { players: room.players });

    console.log(`${playerName} joined ${roomCode}`);
  });

  // ─── Set Chithhi Name ─────────────────────────────────────────────────────
  socket.on('set_chithhi_name', ({ roomCode, chithhiName }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const isDuplicate = room.players.some(
      (p) =>
        p.chithhiName &&
        p.chithhiName.toLowerCase() === chithhiName.toLowerCase()
    );
    if (isDuplicate) {
      socket.emit('error', { message: 'Chithhi name already taken in this room' });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.chithhiName = chithhiName;
      io.to(roomCode).emit('player_updated', { players: room.players });
    }
  });

  // ─── Start Game / Next Round ───────────────────────────────────────────────
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;

    // FIX #12: Enforce minimum 2 players
    if (room.players.length < 2) {
      socket.emit('error', { message: 'At least 2 players are required to start' });
      return;
    }

    const allNamesSet = room.players.every((p) => p.chithhiName);
    if (!allNamesSet) {
      socket.emit('error', { message: 'All players must set their Chithhi names' });
      return;
    }

    // FIX #17: Track rounds properly
    if (room.roundsCurrent >= room.roundsTotal) {
      // Should not be possible via UI but guard anyway
      socket.emit('error', { message: 'Game is already over' });
      return;
    }

    room.status = 'playing';
    room.roundsCurrent += 1;
    room.turnOrder = room.players.map((p) => p.id);
    room.currentTurn = room.turnOrder[0];
    room.maxPasses = room.players.length * 10;
    room.passCount = 0;
    room.slaps = [];

    // Create and shuffle deck
    room.deck = [];
    room.players.forEach((p, index) => {
      for (let i = 0; i < 4; i++) {
        room.deck.push({ id: `c_${index}_${i}`, name: p.chithhiName, ownedBy: p.id });
      }
    });
    for (let i = room.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [room.deck[i], room.deck[j]] = [room.deck[j], room.deck[i]];
    }

    // Deal 4 cards to each player
    room.players.forEach((p) => {
      room.hands[p.id] = room.deck.splice(0, 4);
    });

    // Send individual hands via game_started
    room.players.forEach((p) => {
      io.to(p.id).emit('game_started', {
        status: room.status,
        turnOrder: room.turnOrder,
        currentTurn: room.currentTurn,
        maxPasses: room.maxPasses,
        roundsCurrent: room.roundsCurrent,
        roundsTotal: room.roundsTotal,
        hand: room.hands[p.id],
      });
    });

    io.to(roomCode).emit('turn_start', {
      playerId: room.currentTurn,
      passCount: room.passCount,
    });
  });

  // ─── Pass Card ────────────────────────────────────────────────────────────
  socket.on('pass_card', ({ roomCode, cardId }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing' || room.currentTurn !== socket.id) return;

    const playerHand = room.hands[socket.id];
    const cardIndex = playerHand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const passedCard = playerHand.splice(cardIndex, 1)[0];

    const currentIndex = room.turnOrder.indexOf(socket.id);
    const nextIndex = (currentIndex + 1) % room.turnOrder.length;
    const nextPlayerId = room.turnOrder[nextIndex];

    room.hands[nextPlayerId].push(passedCard);
    room.passCount++;
    room.currentTurn = nextPlayerId;

    io.to(roomCode).emit('card_passed', {
      from: socket.id,
      to: nextPlayerId,
      passCount: room.passCount,
    });
    io.to(socket.id).emit('your_hand', { hand: room.hands[socket.id] });
    io.to(nextPlayerId).emit('your_hand', { hand: room.hands[nextPlayerId] });

    if (room.passCount >= room.maxPasses) {
      endRound(roomCode, null);
    } else {
      io.to(roomCode).emit('turn_start', {
        playerId: room.currentTurn,
        passCount: room.passCount,
      });

      // Notify receiver if they now have 4-of-a-kind so their UI can react
      const receiverHand = room.hands[nextPlayerId];
      const nameCounts = {};
      receiverHand.forEach((c) => {
        nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
      });
      if (Object.values(nameCounts).some((count) => count >= 4)) {
        io.to(nextPlayerId).emit('can_dhappa', {});
      }
    }
  });

  // ─── Trigger Dhappa ───────────────────────────────────────────────────────
  // FIX #6: ANY player can trigger dhappa (not just current-turn player)
  socket.on('trigger_dhappa', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    const nameCounts = {};
    hand.forEach((c) => {
      nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
    });
    const hasDhappa = Object.values(nameCounts).some((count) => count >= 4);
    if (!hasDhappa) return;

    // FIX #1: Set status to 'slappad' BEFORE the timeout fires
    room.status = 'slappad';
    room.slaps = [{ playerId: socket.id, timestamp: 0 }]; // Dhappa player is auto-first

    io.to(roomCode).emit('dhappa_triggered', { by: socket.id });

    // Auto-close slap window after 3 seconds
    setTimeout(() => {
      calculateScoresAndEndRound(roomCode);
    }, 3000);
  });

  // ─── Register Slap ────────────────────────────────────────────────────────
  // FIX #10: Guard against slaps outside of slappad state
  socket.on('register_slap', ({ roomCode, timestamp }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'slappad') return;
    if (!room.slaps.some((s) => s.playerId === socket.id)) {
      room.slaps.push({ playerId: socket.id, timestamp });
    }
  });

  // ─── Score Calculation ────────────────────────────────────────────────────
  const calculateScoresAndEndRound = (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'slappad') return;

    const slaps = [...room.slaps].sort((a, b) => a.timestamp - b.timestamp);
    const numPlayers = room.players.length;

    const scoringTable = {
      2: [1000, 0],
      3: [1000, 500, 0],
      4: [1000, 500, 250, 0],
      5: [1000, 750, 500, 250, 0],
      6: [1000, 800, 600, 400, 200, 0],
    };
    const roundScores =
      scoringTable[numPlayers] || [1000, ...Array(numPlayers - 1).fill(0)];

    const scores = {};
    slaps.forEach((slap, index) => {
      scores[slap.playerId] = index < roundScores.length ? roundScores[index] : 0;
    });

    room.players.forEach((p) => {
      if (scores[p.id] === undefined) scores[p.id] = 0;
      if (!p.score) p.score = { round: 0, total: 0 };
      p.score.round = scores[p.id];
      p.score.total += scores[p.id];
    });

    room.status = 'summary';

    // FIX #17: Determine if the game is over
    const isGameOver = room.roundsCurrent >= room.roundsTotal;

    io.to(roomCode).emit('round_end', {
      scores,
      players: room.players,
      slapOrder: slaps.map((s) => s.playerId),
      isGameOver,
      roundsCurrent: room.roundsCurrent,
      roundsTotal: room.roundsTotal,
    });
  };

  const endRound = (roomCode, dhappaPlayerId) => {
    if (dhappaPlayerId !== null) return;
    const room = rooms[roomCode];
    if (!room) return;

    room.status = 'summary';
    room.players.forEach((p) => {
      if (!p.score) p.score = { round: 0, total: 0 };
      p.score.round = 0;
    });

    const isGameOver = room.roundsCurrent >= room.roundsTotal;

    io.to(roomCode).emit('round_end', {
      scores: {},
      players: room.players,
      stalemate: true,
      isGameOver,
      roundsCurrent: room.roundsCurrent,
      roundsTotal: room.roundsTotal,
    });
  };

  // ─── Disconnect ───────────────────────────────────────────────────────────
  // FIX #5: Proper disconnect handling
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex === -1) continue;

      const disconnectedPlayer = room.players[playerIndex];
      room.players.splice(playerIndex, 1);

      // Room is now empty — clean it up
      if (room.players.length === 0) {
        cleanupRoom(roomCode);
        break;
      }

      // Host left — assign new host
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
      }

      // Mid-game cleanup
      if (room.status === 'playing' || room.status === 'slappad') {
        room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
        delete room.hands[socket.id];

        // Advance turn if it was this player's turn
        if (room.currentTurn === socket.id && room.turnOrder.length > 0) {
          room.currentTurn = room.turnOrder[0];
          if (room.status === 'playing') {
            io.to(roomCode).emit('turn_start', {
              playerId: room.currentTurn,
              passCount: room.passCount,
            });
          }
        }

        // Abort if too few players remain
        if (room.players.length < 2) {
          io.to(roomCode).emit('game_aborted', {
            reason: `${disconnectedPlayer.name} left the game`,
          });
          cleanupRoom(roomCode);
          break;
        }
      }

      io.to(roomCode).emit('player_left', {
        players: room.players,
        hostId: room.hostId,
        disconnectedName: disconnectedPlayer.name,
      });

      break;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
