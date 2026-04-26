import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';

const SlapPadScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();
  
  const [slapped, setSlapped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000); // 3 seconds
  
  const timerRef = useRef(null);
  
  const isDhappaPlayer = gameState.dhappaBy === socket.id;
  const dhappaPlayerName = gameState.players.find(p => p.id === gameState.dhappaBy)?.name;

  useEffect(() => {
    // Start countdown
    const startTime = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 3000 - elapsed);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(timerRef.current);
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, []);

  // Listen for round end to move to summary
  useEffect(() => {
     if(!socket) return;
     const handleRoundEnd = (data) => {
        updateGameState({ 
            status: 'summary', 
            scores: data.scores || {}, 
            players: data.players || gameState.players,
            slapOrder: data.slapOrder || [],
            stalemate: data.stalemate || false
        });
     };
     socket.on('round_end', handleRoundEnd);
     return () => socket.off('round_end', handleRoundEnd);
  }, [socket, updateGameState]);

  const handleSlap = (e) => {
    // Prevent default to avoid any weird zooming/scrolling on mobile
    e.preventDefault();
    
    if (slapped || isDhappaPlayer) return;
    
    setSlapped(true);
    socket?.emit('register_slap', { roomCode: gameState.roomCode, timestamp: Date.now() });
  };

  // Generate zones for other players (visual only, any tap registers)
  const otherPlayers = gameState.players.filter(p => p.id !== gameState.dhappaBy);
  const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'];

  return (
    <div 
        className="fixed inset-0 z-50 flex flex-col bg-ink text-paper touch-none"
        onPointerDown={handleSlap} // Use pointer events for faster touch response
    >
      {/* Dramatic Flash Effect */}
      <motion.div 
         initial={{ opacity: 1 }}
         animate={{ opacity: 0 }}
         transition={{ duration: 0.5, ease: "easeOut" }}
         className="absolute inset-0 bg-yellow-400 pointer-events-none z-10"
      />

      <div className="p-8 text-center flex flex-col items-center justify-center z-20 pointer-events-none">
         <motion.h1 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className="text-6xl font-black italic tracking-tighter text-yellow-400 drop-shadow-[0_4px_0_#fff]"
         >
            DHAPPA!!
         </motion.h1>
         <p className="text-xl mt-2">by {dhappaPlayerName}</p>
         
         {!isDhappaPlayer && !slapped && (
            <div className="mt-8">
                <p className="text-3xl font-bold uppercase animate-pulse">Slap the screen!</p>
                <div className="w-full max-w-xs bg-ink-light rounded-full h-4 mt-4 overflow-hidden border border-ink">
                   <div 
                      className="bg-yellow-400 h-full"
                      style={{ width: `${(timeLeft / 3000) * 100}%` }}
                   />
                </div>
            </div>
         )}
         
         {slapped && (
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="mt-12 text-2xl font-bold text-green-400"
            >
               SLAP RECORDED!
            </motion.div>
         )}
      </div>

      {/* Slap Zones (Visual Grid) */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-2 pointer-events-none opacity-80">
         {otherPlayers.map((p, i) => (
             <div 
                key={p.id} 
                className={`${colors[i % colors.length]} rounded-xl flex items-center justify-center text-ink font-black text-2xl opacity-50`}
             >
                {p.name}'s Zone
             </div>
         ))}
      </div>
      
      {/* Huge invisible overlay to catch taps just in case */}
      <div className="absolute inset-0 z-0 bg-transparent" />
    </div>
  );
};

export default SlapPadScreen;
