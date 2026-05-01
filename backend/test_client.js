const { io } = require('socket.io-client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'test_game_winner@example.com',
    password: 'password123'
  });
  
  if (!signInData.session) {
    console.log("No session", signInData);
    return;
  }
  
  const token = signInData.session.access_token;
  const socket = io('http://localhost:3001', { auth: { token } });

  socket.on('connect', () => {
    socket.emit('create_room', { playerName: 'Test Winner' });
  });
  
  socket.on('room_created', ({ roomCode }) => {
    console.log("Room:", roomCode);
    socket.emit('set_chithhi_name', { roomCode, chithhiName: 'Test' });
    
    setTimeout(() => {
      // Force end game by emitting a fake command if possible? We can't.
      // But we can trigger it if we just mock the room in the server!
      process.exit(0);
    }, 1000);
  });
}
runTest();
