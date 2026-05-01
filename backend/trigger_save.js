const { io } = require('socket.io-client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'test_game_winner@example.com',
    password: 'password123'
  });
  
  const token = signInData.session.access_token;
  const socket = io('http://localhost:3001', { auth: { token } });

  socket.on('connect', () => {
    socket.emit('create_room', { playerName: 'Paresh' });
  });

  socket.on('room_created', ({ roomCode }) => {
    socket.emit('set_chithhi_name', { roomCode, chithhiName: 'Paper' });
    
    setTimeout(() => {
      // We can't start game with 1 player. We must add a 2nd dummy player!
    }, 500);
  });
}
// Just run it and see if anything breaks... Wait, I can't start a game without 2 players.
