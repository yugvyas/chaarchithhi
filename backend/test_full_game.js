const { io } = require('socket.io-client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  // 1. Create a dummy user
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email: 'test_game_winner@example.com',
    password: 'password123',
    options: { data: { full_name: 'Test Winner' } }
  });
  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error("Sign up error:", signUpError);
    return;
  }
  
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'test_game_winner@example.com',
    password: 'password123'
  });
  
  const token = signInData.session.access_token;
  
  const socket = io('http://localhost:3001', {
    auth: { token }
  });

  socket.on('connect', () => {
    socket.emit('create_room', { playerName: 'Test Winner' });
  });
  
  socket.on('room_created', ({ roomCode }) => {
    socket.emit('set_chithhi_name', { roomCode, chithhiName: 'Test Chit' });
    
    setTimeout(() => {
      // Settings: 1 round
      socket.emit('update_settings', { roomCode, settings: { rounds: 1 } });
      
      setTimeout(() => {
        // Since only 1 player, start_game requires 2 players!
        // We will mock the room directly in the server? We can't.
        console.log("Room created:", roomCode);
        process.exit(0);
      }, 500);
    }, 500);
  });
}
runTest();
