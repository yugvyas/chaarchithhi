# Chaar Chithhi 🃏

A real-time, multiplayer web adaptation of the classic Indian card game "Chaar Chithhi" (also known as Slap or Dhappa), built with React, Socket.io, and Node.js.

## 🌟 Features

- **Real-Time Multiplayer**: Seamless, sub-millisecond synchronization powered by Socket.io.
- **Beautiful Paper Aesthetic**: A carefully crafted, immersive "ruled paper and ink" design inspired by classic tabletop games.
- **Dynamic Gameplay**: 
  - Fan out your cards and pass them to other players in real-time.
  - Call **"Dhappa!"** when you collect 4 of a kind.
  - Giant, explosive "SLAP!!" reaction screen for all other players with a 3-second countdown.
  - Server-side millisecond timestamping to accurately rank who slapped first!
- **Mobile Optimized**: Zero "double-tap-to-zoom" issues. Built to feel exactly like a native app on your phone.
- **Animated Results**: Watch the confetti rain down on the Final Results screen as the winner is crowned.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Fonts**: Caveat, Patrick Hand, Inter

## 🚀 How to Run Locally

### 1. Start the Backend Server
Open a terminal, navigate to the `backend` folder, and run:
```bash
cd backend
npm install
node index.js
```
*(The server will start on port 3001 and listen on all network interfaces).*

### 2. Start the Frontend App
Open a new terminal, navigate to the `frontend` folder, and run:
```bash
cd frontend
npm install
npm run dev -- --host
```
*(The `--host` flag ensures the game is accessible to other devices on your local Wi-Fi).*

### 3. Play on Your Phone!
- Find your local IP address (e.g., `192.168.x.x` or `10.x.x.x`).
- Ensure your phone and computer are on the same Wi-Fi network.
- Open your phone's browser and go to `http://<YOUR_IP_ADDRESS>:5174` (or whichever port Vite assigned).
- Create a room on one device, join using the Room Code on the other, and start passing cards!

## 🎮 How to Play

1. **Setup**: Join a room and pick a secret "Chithhi" name (e.g., Batman, Superman).
2. **The Goal**: Collect 4 cards matching your secret name.
3. **Passing**: On your turn, select a card from your hand and pass it to the next player.
4. **Dhappa!**: The moment someone collects 4 of a kind, they will automatically trigger a **Dhappa!**.
5. **Slap!**: Everyone else has 3 seconds to smash the giant SLAP button on their screen. The slowest player loses!
6. **Win**: Survive the rounds and rack up the most points to take home the crown!
