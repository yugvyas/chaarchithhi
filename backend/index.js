const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { getRank } = require('./ranks');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.log('Socket connect rejected: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.warn('WARNING: SUPABASE_JWT_SECRET is not set in backend/.env');
    return next(new Error('Server configuration error'));
  }

  // Use Supabase client to verify token instead of jsonwebtoken
  // This avoids base64 encoding issues with the JWT secret
  if (!supabase) {
    return next(new Error('Server configuration error: Supabase not initialized'));
  }

  supabase.auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      console.log('Socket connect rejected: Invalid token', error?.message);
      return next(new Error('Authentication error: Invalid token'));
    }
    
    // Store user data in socket for later use
    socket.user = {
      sub: data.user.id,
      email: data.user.email,
      ...data.user.user_metadata
    };
    next();
  });
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
      players: [{ id: socket.id, userId: socket.user?.sub, name: playerName, chithhiName: null }],
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
      turnTimeout: null,
      settings: {
        strictDhappa: false, // "Dirty Hand" rule: true = must have exactly 4 cards
        rounds: 3,
        turnTimeLimit: 20000,
        falseDhappaPenalty: true,
        challengeSystem: true,
        negativeScores: false,
        maxPassesMultiplier: 10,
      },
      dhappaInfo: null,
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

    room.players.push({ id: socket.id, userId: socket.user?.sub, name: playerName, chithhiName: null });
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

  // ─── Update Settings ──────────────────────────────────────────────────────
  socket.on('update_settings', ({ roomCode, settings }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.settings = { ...room.settings, ...settings };
    room.roundsTotal = room.settings.rounds; // Sync roundsTotal
    io.to(roomCode).emit('settings_updated', { settings: room.settings });
  });

  // ─── Player Management ─────────────────────────────────────────────────────
  socket.on('kick_player', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    
    // Find the player to kick
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || playerId === socket.id) return; // Cannot kick oneself
    
    const kickedPlayerName = room.players[playerIndex].name;
    room.players.splice(playerIndex, 1);
    
    // Notify the kicked player specifically
    io.to(playerId).emit('kicked', { message: 'You have been kicked from the room.' });
    // Make them leave the socket room
    const targetSocket = io.sockets.sockets.get(playerId);
    if (targetSocket) {
      targetSocket.leave(roomCode);
    }
    
    io.to(roomCode).emit('player_updated', { players: room.players });
    io.to(roomCode).emit('notification', { message: `${kickedPlayerName} was kicked from the room.` });
  });

  socket.on('transfer_host', ({ roomCode, newHostId }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    
    const newHostExists = room.players.some(p => p.id === newHostId);
    if (!newHostExists) return;
    
    room.hostId = newHostId;
    io.to(roomCode).emit('host_changed', { newHostId });
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

    // Clear any pending dhappa state
    room.dhappaInfo = null;

    room.status = 'playing';
    room.roundsCurrent += 1;
    room.turnOrder = room.players.map((p) => p.id);
    room.currentTurn = room.turnOrder[0];
    room.maxPasses = room.players.length * room.settings.maxPassesMultiplier;
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
    startTurnTimer(roomCode);
  });

  const reshufflePlayerHand = (roomCode, playerId) => {
    const room = rooms[roomCode];
    if (!room) return;

    const hand = room.hands[playerId];
    if (!hand) return;

    // Put cards back in deck
    room.deck.push(...hand);
    
    // Shuffle deck
    for (let i = room.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [room.deck[i], room.deck[j]] = [room.deck[j], room.deck[i]];
    }

    // Draw 4 new ones
    room.hands[playerId] = room.deck.splice(0, 4);
    
    io.to(playerId).emit('your_hand', { hand: room.hands[playerId] });
  };

  const startTurnTimer = (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.turnTimeout) clearTimeout(room.turnTimeout);

    room.turnTimeout = setTimeout(() => {
      const currentPlayerId = room.currentTurn;
      const hand = room.hands[currentPlayerId];
      if (!hand || hand.length === 0) return;

      // Pick a random card
      const randomIndex = Math.floor(Math.random() * hand.length);
      const cardId = hand[randomIndex].id;

      // Simulate pass_card
      console.log(`Auto-passing card ${cardId} for player ${currentPlayerId} in room ${roomCode}`);
      handlePassCard(roomCode, currentPlayerId, cardId);
    }, room.settings.turnTimeLimit > 0 ? room.settings.turnTimeLimit : 2147483647); // large number if no limit
  };

  const handlePassCard = (roomCode, playerId, cardId) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing' || room.currentTurn !== playerId) return;

    // Check if player is sitting out
    const player = room.players.find(p => p.id === playerId);
    if (player && player.sittingOut) {
      // This shouldn't happen if turn advancement skips them, but guard anyway
      player.sittingOut = false; // Reset for next time
    }

    if (room.turnTimeout) clearTimeout(room.turnTimeout);

    const playerHand = room.hands[playerId];
    const cardIndex = playerHand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const passedCard = playerHand.splice(cardIndex, 1)[0];

    const currentIndex = room.turnOrder.indexOf(playerId);
    let nextIndex = (currentIndex + 1) % room.turnOrder.length;
    let nextPlayerId = room.turnOrder[nextIndex];

    // Skip sitting out players
    const nextPlayer = room.players.find(p => p.id === nextPlayerId);
    if (nextPlayer && nextPlayer.sittingOut) {
      console.log(`Player ${nextPlayer.name} is sitting out, skipping turn.`);
      nextPlayer.sittingOut = false; // They sat out this turn
      nextIndex = (nextIndex + 1) % room.turnOrder.length;
      nextPlayerId = room.turnOrder[nextIndex];
      io.to(roomCode).emit('player_skipped', { playerId: nextPlayer.id });
    }

    room.hands[nextPlayerId].push(passedCard);
    room.passCount++;
    room.currentTurn = nextPlayerId;

    io.to(roomCode).emit('card_passed', {
      from: playerId,
      to: nextPlayerId,
      passCount: room.passCount,
    });
    io.to(playerId).emit('your_hand', { hand: room.hands[playerId] });
    io.to(nextPlayerId).emit('your_hand', { hand: room.hands[nextPlayerId] });

    if (room.passCount >= room.maxPasses) {
      endRound(roomCode, null);
    } else {
      // Check if next player is sitting out
      const checkNextTurn = () => {
        const currentPlayer = room.players.find(p => p.id === room.currentTurn);
        if (currentPlayer && (currentPlayer.sittingOutCount || 0) > 0) {
          console.log(`Skipping sitting out player: ${currentPlayer.name} (${currentPlayer.sittingOutCount} left)`);
          currentPlayer.sittingOutCount--;
          
          const curIndex = room.turnOrder.indexOf(room.currentTurn);
          const nxtIndex = (curIndex + 1) % room.turnOrder.length;
          room.currentTurn = room.turnOrder[nxtIndex];
          
          io.to(roomCode).emit('player_skipped', { 
            playerId: currentPlayer.id, 
            sittingOutCount: currentPlayer.sittingOutCount,
            nextPlayerId: room.currentTurn 
          });
          
          checkNextTurn();
        }
      };

      checkNextTurn();

      io.to(roomCode).emit('turn_start', {
        playerId: room.currentTurn,
        passCount: room.passCount,
      });
      startTurnTimer(roomCode);
    }
  };

  // ─── Pass Card ────────────────────────────────────────────────────────────
  socket.on('pass_card', ({ roomCode, cardId }) => {
    handlePassCard(roomCode, socket.id, cardId);
  });

  // ─── Trigger Dhappa ───────────────────────────────────────────────────────
  socket.on('trigger_dhappa', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing' || room.dhappaInfo) return;

    const hand = room.hands[socket.id];
    if (!hand) return;

    const nameCounts = {};
    hand.forEach((c) => {
      nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
    });
    const has4Matching = Object.values(nameCounts).some((count) => count >= 4);
    const player = room.players.find(p => p.id === socket.id);

    // Instant Validation
    if (!has4Matching) {
      // FALSE DHAPPA FLOW
      if (player && room.settings.falseDhappaPenalty) {
        if (!player.score) player.score = { total: 0 };
        player.score.total -= 500;
        player.sittingOutCount = 2;
        
        if (!player.stats) player.stats = { challengeAccuracy: 0, challengesAttempted: 0, timesCaught: 0 };
        player.stats.timesCaught = (player.stats.timesCaught || 0) + 1;
      }
      
      reshufflePlayerHand(roomCode, socket.id);

      io.to(roomCode).emit('false_dhappa', { 
        by: socket.id, 
        players: room.players 
      });

      const curIdx = room.turnOrder.indexOf(socket.id);
      const nxtIdx = (curIdx + 1) % room.turnOrder.length;
      room.currentTurn = room.turnOrder[nxtIdx];
      
      io.to(roomCode).emit('turn_start', {
        playerId: room.currentTurn,
        passCount: room.passCount,
      });
      startTurnTimer(roomCode);
      return;
    }

    const isDirtyHand = hand.length > 4 && room.settings.strictDhappa;
    
    room.status = 'slappad';
    room.dhappaInfo = {
      by: socket.id,
      isActuallyValid: !isDirtyHand,
      challengers: [],
      timer: null,
      startTime: Date.now()
    };
    room.slaps = [{ playerId: socket.id, timestamp: 0 }];
    
    if (!player.stats) player.stats = {};
    player.stats.dhappasMade = (player.stats.dhappasMade || 0) + 1;

    if (room.turnTimeout) {
      clearTimeout(room.turnTimeout);
      room.turnTimeout = null;
    }

    io.to(roomCode).emit('dhappa_triggered', { 
      by: socket.id,
      challengeable: room.settings.challengeSystem 
    });

    // If challenge system is off, skip the challenge window and go straight to scoring
    if (!room.settings.challengeSystem) {
      calculateScoresAndEndRound(roomCode);
      return;
    }

    // 5-second challenge window
    room.dhappaInfo.timer = setTimeout(() => {
      resolveDhappaChallenge(roomCode);
    }, 5000);
  });

  const resolveDhappaChallenge = (roomCode) => {
    const room = rooms[roomCode];
    if (!room || !room.dhappaInfo) return;

    const { by, isActuallyValid, challengers } = room.dhappaInfo;
    
    if (challengers.length > 0) {
      if (isActuallyValid) {
        challengers.forEach(cid => {
          const c = room.players.find(p => p.id === cid);
          if (c) {
            if (!c.score) c.score = { total: 0 };
            c.score.total -= 300;
            c.hasClownFace = true;
          }
        });
        
        const dhappaPlayer = room.players.find(p => p.id === by);
        if (dhappaPlayer) {
          if (!dhappaPlayer.score) dhappaPlayer.score = { total: 0 };
          dhappaPlayer.score.total += 200;
        }

        io.to(roomCode).emit('challenge_failed_summary', { 
          challengers, 
          dhappaBy: by,
          players: room.players 
        });

        setTimeout(() => {
          calculateScoresAndEndRound(roomCode);
        }, 2000);
      } else {
        const dhappaPlayer = room.players.find(p => p.id === by);
        if (dhappaPlayer) {
          if (!dhappaPlayer.score) dhappaPlayer.score = { total: 0 };
          dhappaPlayer.score.total -= 600;
          
          if (!dhappaPlayer.stats) dhappaPlayer.stats = { timesCaught: 0 };
          dhappaPlayer.stats.timesCaught++;
        }

        const rewardPerChallenger = Math.floor(400 / challengers.length);
        challengers.forEach(cid => {
          const c = room.players.find(p => p.id === cid);
          if (c) {
            if (!c.score) c.score = { total: 0 };
            c.score.total += rewardPerChallenger;
            
            if (!c.stats) c.stats = { challengesAttempted: 0, challengeAccuracy: 0 };
            c.stats.challengesAttempted++;
            c.stats.challengeAccuracy = (c.stats.challengeAccuracy || 0) + 1;
          }
        });

        reshufflePlayerHand(roomCode, by);

        io.to(roomCode).emit('challenge_success_summary', { 
          challengers, 
          dhappaBy: by,
          players: room.players 
        });

        room.dhappaInfo = null;
        room.status = 'playing';

        io.to(roomCode).emit('turn_start', {
          playerId: room.currentTurn,
          passCount: room.passCount,
        });
        startTurnTimer(roomCode);
      }
    } else {
      calculateScoresAndEndRound(roomCode);
    }
  };

  // ─── Challenge Dhappa ─────────────────────────────────────────────────────
  socket.on('challenge_dhappa', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.dhappaInfo) return;
    if (room.dhappaInfo.by === socket.id) return;
    if (room.dhappaInfo.challengers.includes(socket.id)) return;

    room.dhappaInfo.challengers.push(socket.id);
    
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      if (!player.stats) player.stats = { challengesAttempted: 0 };
      player.stats.challengesAttempted++;
    }

    io.to(roomCode).emit('dhappa_challenged', { challenger: socket.id });
  });

  // ─── Register Slap ────────────────────────────────────────────────────────
  socket.on('register_slap', ({ roomCode, timestamp }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'slappad') return;
    if (!room.slaps.some((s) => s.playerId === socket.id)) {
      room.slaps.push({ playerId: socket.id, timestamp });
      
      const player = room.players.find(p => p.id === socket.id);
      if (player && room.dhappaInfo) {
        const slapTimeMs = Date.now() - room.dhappaInfo.startTime;
        if (!player.stats) player.stats = {};
        if (!player.stats.fastestSlap || slapTimeMs < player.stats.fastestSlap) {
          player.stats.fastestSlap = slapTimeMs;
        }
      }
    }
  });

  // ─── Score Calculation ────────────────────────────────────────────────────
  const calculateScoresAndEndRound = async (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

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
      let score = index < roundScores.length ? roundScores[index] : 0;
      scores[slap.playerId] = score;
    });

    room.players.forEach((p) => {
      if (scores[p.id] === undefined) scores[p.id] = 0;
      if (!p.score) p.score = { round: 0, total: 0 };
      p.score.round = scores[p.id];
      p.score.total += scores[p.id];
      
      // Handle negative scores setting
      if (!room.settings.negativeScores && p.score.total < 0) {
        p.score.total = 0;
      }
      
      p.hasClownFace = p.hasClownFace || false;
    });

    room.status = 'summary';
    room.dhappaInfo = null;

    const isGameOver = room.roundsCurrent >= room.roundsTotal;

    let rankUps = null;
    if (isGameOver) {
      rankUps = await saveGameToDatabase(roomCode);
    }

    io.to(roomCode).emit('round_end', {
      scores,
      players: room.players,
      slapOrder: slaps.map((s) => s.playerId),
      isGameOver,
      roundsCurrent: room.roundsCurrent,
      roundsTotal: room.roundsTotal,
      rankUps,
    });
  };

  const endRound = async (roomCode, dhappaPlayerId) => {
    if (dhappaPlayerId !== null) return;
    const room = rooms[roomCode];
    if (!room) return;

    room.status = 'summary';
    room.players.forEach((p) => {
      if (!p.score) p.score = { round: 0, total: 0 };
      p.score.round = 0;
      p.hasClownFace = false;
    });

    const isGameOver = room.roundsCurrent >= room.roundsTotal;

    let rankUps = null;
    if (isGameOver) {
      rankUps = await saveGameToDatabase(roomCode);
    }

    if (room.turnTimeout) {
      clearTimeout(room.turnTimeout);
      room.turnTimeout = null;
    }

    io.to(roomCode).emit('round_end', {
      scores: {},
      players: room.players,
      stalemate: true,
      isGameOver,
      roundsCurrent: room.roundsCurrent,
      roundsTotal: room.roundsTotal,
      rankUps,
    });
  };

  const saveGameToDatabase = async (roomCode) => {
    const room = rooms[roomCode];
    if (!room || !supabase) return;

    try {
      const sortedPlayers = [...room.players].sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
      const winnerId = sortedPlayers[0]?.userId;

      // 1. Insert into game_history
      const { data: gameData, error: gameError } = await supabase
        .from('game_history')
        .insert({
          room_code: roomCode,
          total_rounds: room.roundsTotal,
          winner_id: winnerId
        })
        .select()
        .single();

      if (gameError) throw gameError;

      const gameId = gameData.id;

      // 2. Prepare game_players records
      const playerRecords = sortedPlayers.map((p, index) => ({
        game_id: gameId,
        user_id: p.userId,
        total_score: p.score?.total || 0,
        final_rank: index + 1,
        total_dhappas: p.stats?.dhappasMade || 0,
        false_dhappas: p.stats?.timesCaught || 0,
        successful_challenges: p.stats?.challengeAccuracy || 0,
        fastest_slap_ms: p.stats?.fastestSlap || null
      })).filter(r => r.user_id); // Only save authenticated users

      if (playerRecords.length > 0) {
        const { error: playersError } = await supabase
          .from('game_players')
          .insert(playerRecords);
        if (playersError) throw playersError;
      }
      
      // --- STEP 3: UPDATE RATING AND PROFILES ---
      const userIds = sortedPlayers.map(p => p.userId).filter(Boolean);
      let rankUps = {}; // { playerId: { oldRank, newRank } }
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, rating, xp, level')
          .in('id', userIds);
          
        if (profiles) {
          const profileMap = {};
          profiles.forEach(p => profileMap[p.id] = p);
          
          const totalRating = profiles.reduce((sum, p) => sum + (p.rating || 1000), 0);
          
          const updates = sortedPlayers.filter(p => p.userId).map((p, index) => {
            const isWinner = index === 0;
            const isLast = index === sortedPlayers.length - 1;
            const actualScore = isWinner ? 1 : (isLast ? 0 : 0.5);
            
            const oldProfile = profileMap[p.userId] || { rating: 1000, xp: 0, level: 1 };
            const oldRating = oldProfile.rating || 1000;
            const oldXp = oldProfile.xp || 0;
            
            // Opponent rating = average of OTHER players
            const otherPlayersCount = profiles.length > 1 ? profiles.length - 1 : 1;
            const opponentRating = profiles.length > 1 ? (totalRating - oldRating) / otherPlayersCount : oldRating;
            
            // Expected = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
            const expected = 1 / (1 + Math.pow(10, (opponentRating - oldRating) / 400));
            // New Rating = Old Rating + 32 * (Actual - Expected)
            const newRating = Math.round(oldRating + 32 * (actualScore - expected));
            
            const xpGained = isWinner ? 500 : (isLast ? 100 : 200);
            const newXp = oldXp + xpGained;
            const newLevel = Math.floor(newXp / 1000) + 1;
            
            // Check for Rank Up
            const oldRank = getRank(oldRating);
            const newRank = getRank(newRating);
            if (newRank.title !== oldRank.title && newRating > oldRating) {
              rankUps[p.id] = { oldRank, newRank };
            }
            
            return {
              id: p.userId,
              rating: newRating,
              xp: newXp,
              level: newLevel
            };
          });
          
          // Update profiles
          for (const update of updates) {
            await supabase.from('profiles').update({
              rating: update.rating,
              xp: update.xp,
              level: update.level
            }).eq('id', update.id);
          }
        }
      }
      
      console.log(`[DB] Game ${roomCode} saved. Profiles & Ratings updated.`);
      return Object.keys(rankUps).length > 0 ? rankUps : null;
    } catch (error) {
      console.error("[DB] Error saving game to database:", error);
      require('fs').appendFileSync('db_error.log', new Date().toISOString() + ' ' + (error.message || JSON.stringify(error)) + '\n');
      return null;
    }
  };

  // ─── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex === -1) continue;

      const disconnectedPlayer = room.players[playerIndex];
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        cleanupRoom(roomCode);
        break;
      }

      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
      }

      if (room.status === 'playing' || room.status === 'slappad') {
        room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
        delete room.hands[socket.id];

        if (room.currentTurn === socket.id && room.turnOrder.length > 0) {
          room.currentTurn = room.turnOrder[0];
          if (room.status === 'playing') {
            io.to(roomCode).emit('turn_start', {
              playerId: room.currentTurn,
              passCount: room.passCount,
            });
            startTurnTimer(roomCode);
          }
        }

        // Clear timeout if everyone left or game state changes
        if (room.players.length < 2 && room.turnTimeout) {
          clearTimeout(room.turnTimeout);
          room.turnTimeout = null;
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
