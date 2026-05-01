const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const dummyToken = jwt.sign({ sub: 'test-user', email: 'test@example.com' }, process.env.SUPABASE_JWT_SECRET);

const socket = io('http://localhost:3001', {
  auth: { token: dummyToken }
});

socket.on('connect', () => {
  console.log('Connected successfully with JWT!');
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.log('Connection failed:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for connection');
  process.exit(1);
}, 3000);
