import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { Users, Play } from 'lucide-react';

const LandingScreen = () => {
  const { socket, isConnected } = useSocket();
  const { updateGameState } = useGame();
  
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('room_created', (data) => {
      updateGameState({
        roomCode: data.roomCode,
        hostId: data.hostId,
        players: data.players,
        status: 'lobby',
        playerName: name
      });
    });

    socket.on('player_joined', (data) => {
        // Only trigger for the person joining
        updateGameState({
            players: data.players,
            status: 'lobby',
            playerName: name,
            roomCode: roomCode.toUpperCase()
        });
    });
    
    socket.on('error', (err) => {
        setError(err.message);
    });

    return () => {
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('error');
    };
  }, [socket, name, roomCode, updateGameState]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
        setError("Please enter your name");
        return;
    }
    socket.emit('create_room', { playerName: name });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) {
        setError("Please enter name and room code");
        return;
    }
    socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName: name });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 relative overflow-y-auto overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-6xl font-serif italic font-bold text-ink drop-shadow-[0_4px_4px_rgba(212,175,55,0.3)] mb-2 transform -rotate-2">
          Chaar Chithhi
        </h1>
        <p className="font-handwritten text-[#AA8822] text-2xl font-bold tracking-wide">The classic paper passing game</p>
      </motion.div>

      {!mode ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col gap-6 w-full max-w-sm z-10"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('create')}
            className="group relative flex items-center justify-center gap-3 w-full bg-ink text-paper py-4 px-6 rounded-2xl font-bold text-xl shadow-card-lifted transition-all"
          >
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Users size={24} className="text-accent-gold" />
            <span className="font-serif tracking-wider">Create Room</span>
          </motion.button>
          
          <div className="flex items-center gap-4 text-ink-light opacity-60">
            <div className="h-px bg-ink/20 flex-1"></div>
            <span className="font-medium text-sm uppercase tracking-wider font-body">OR</span>
            <div className="h-px bg-ink/20 flex-1"></div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('join')}
            className="group relative flex items-center justify-center gap-3 w-full bg-paper border border-ink/20 text-ink py-4 px-6 rounded-2xl font-bold text-xl shadow-depth transition-all"
          >
             <div className="absolute inset-0 bg-accent-gold/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Play size={24} className="text-ink" />
            <span className="font-serif tracking-wider">Join Room</span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full max-w-sm bg-paper-light p-8 rounded-3xl shadow-paper-lifted border border-ink/10 relative z-10"
        >
          <button 
            onClick={() => { setMode(null); setError(''); }}
            className="absolute top-4 right-4 text-ink-light hover:text-ink text-sm font-medium"
          >
            Back
          </button>
          
          <h2 className="text-3xl font-serif font-bold mb-6 text-ink drop-shadow-sm">
            {mode === 'create' ? 'Host Game' : 'Join Game'}
          </h2>

          <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-widest mb-1 ml-1">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b-2 border-ink/20 px-2 py-2 text-2xl font-handwritten focus:outline-none focus:border-accent-gold transition-colors"
                placeholder="Enter your name"
                autoFocus
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-widest mb-1 ml-1">Room Code</label>
                <input 
                  type="text" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-transparent border-b-2 border-ink/20 px-2 py-2 text-2xl font-mono uppercase tracking-widest focus:outline-none focus:border-accent-gold transition-colors"
                  placeholder="CODE"
                  maxLength={6}
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-md border border-red-100">{error}</p>}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!isConnected}
              className="mt-4 w-full bg-ink text-[#F3E5AB] py-4 rounded-xl font-serif font-bold text-lg tracking-wider shadow-card-lifted transition-all disabled:opacity-50"
            >
              {mode === 'create' ? 'Create Room' : 'Enter Room'}
            </motion.button>
          </form>
        </motion.div>
      )}
      
      {!isConnected && (
         <div className="absolute bottom-4 text-xs text-ink-light opacity-50">
             Connecting to server...
         </div>
      )}
    </div>
  );
};

export default LandingScreen;
