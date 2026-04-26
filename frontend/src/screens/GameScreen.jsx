import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

const GameScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();
  
  const [selectedCardId, setSelectedCardId] = useState(null);
  
  const isMyTurn = gameState.currentTurn === socket.id;

  // Check for Dhappa condition
  const nameCounts = {};
  gameState.hand.forEach(c => {
    nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
  });
  const canDhappa = Object.values(nameCounts).some(count => count >= 4);

  useEffect(() => {
    if (!socket) return;

    const handleTurnStart = (data) => {
      updateGameState({ 
          currentTurn: data.playerId, 
          passCount: data.passCount,
          status: data.playerId === socket.id ? 'cover' : 'playing'
      });
    };

    const handleHand = (data) => {
      updateGameState({ hand: data.hand });
    };

    const handleDhappaTriggered = (data) => {
      updateGameState({ status: 'slappad', dhappaBy: data.by });
    };

    const handleRoundEnd = (data) => {
        updateGameState({ 
            status: 'summary', 
            scores: data.scores || {}, 
            players: data.players || gameState.players,
            slapOrder: data.slapOrder || [],
            stalemate: data.stalemate || false
        });
    };

    socket.on('turn_start', handleTurnStart);
    socket.on('your_hand', handleHand);
    socket.on('dhappa_triggered', handleDhappaTriggered);
    socket.on('round_end', handleRoundEnd);

    return () => {
      socket.off('turn_start', handleTurnStart);
      socket.off('your_hand', handleHand);
      socket.off('dhappa_triggered', handleDhappaTriggered);
      socket.off('round_end', handleRoundEnd);
    };
  }, [socket, updateGameState]);

  const handlePass = () => {
    if (!selectedCardId) return;
    socket.emit('pass_card', { roomCode: gameState.roomCode, cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleDhappa = () => {
    if (!canDhappa) return;
    socket.emit('trigger_dhappa', { roomCode: gameState.roomCode });
  };

  // Visual urgency for passes
  const passesRemaining = gameState.maxPasses - gameState.passCount;
  const isUrgent = passesRemaining <= 10;

  return (
    <div className="flex flex-col h-full w-full relative overflow-y-auto overflow-x-hidden bg-paper">
      {/* Header Info */}
      <div className="flex justify-between items-center p-6 border-b border-ink/10 bg-white/30 backdrop-blur-md">
         <div className={`px-5 py-2 rounded-2xl border-2 shadow-sm ${isUrgent ? 'border-red-500 bg-red-50 text-red-700 animate-pulse' : 'border-ink/10 bg-white shadow-depth'}`}>
            <span className="font-bold font-sans text-lg">{gameState.passCount}</span> <span className="text-sm font-medium opacity-80 uppercase tracking-widest">/ {gameState.maxPasses} Passes</span>
         </div>
         <div className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-2xl border ${isMyTurn ? 'bg-accent-goldLight text-accent-goldDark border-accent-gold' : 'bg-transparent text-ink/50 border-transparent'}`}>
            {isMyTurn ? "Your Turn" : "Waiting"}
         </div>
      </div>

      {/* Circle of Players Area (Visual representation) */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-[300px]">
         <div className="w-full max-w-xs aspect-square rounded-full border border-ink/5 relative flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.02)]">
            {/* Center Table */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-paper-dark/30 border border-ink/10 flex items-center justify-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.05)] backdrop-blur-sm">
               <span className="font-serif italic text-ink/30 text-xl sm:text-2xl transform -rotate-12 tracking-widest">Table</span>
            </div>

            {/* Players arranged in circle */}
            {gameState.turnOrder.map((playerId, i) => {
                const player = gameState.players.find(p => p.id === playerId);
                const isActive = gameState.currentTurn === playerId;
                const angle = (i / gameState.turnOrder.length) * Math.PI * 2 - Math.PI / 2;
                // Calculate position on circle
                const radius = window.innerWidth < 400 ? 95 : 120; // Dynamic radius
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                    <motion.div 
                        key={playerId}
                        animate={{ 
                            scale: isActive ? 1.15 : 1,
                            zIndex: isActive ? 10 : 1
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`absolute flex flex-col items-center justify-center p-3 rounded-2xl transition-colors ${isActive ? 'bg-white shadow-card-lifted border border-accent-gold/50' : ''}`}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-depth ${isActive ? 'bg-accent-goldDark text-white shadow-gold-glow' : 'bg-paper-dark text-ink border border-ink/10'}`}>
                            {player?.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-xs font-bold max-w-[70px] truncate text-center uppercase tracking-widest ${isActive ? 'text-ink' : 'text-ink/40'}`}>
                            {player?.name}
                        </span>
                    </motion.div>
                )
            })}
         </div>
      </div>

      {/* Action Area / Hand */}
      <div className={`bg-white/80 backdrop-blur-xl border-t border-ink/10 p-6 rounded-t-[2.5rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 ${isMyTurn ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-4 pointer-events-none'}`}>
          <div className="flex justify-between items-end mb-6 px-2">
              <h3 className="font-serif italic text-2xl font-bold text-ink">Your Hand</h3>
              
              {canDhappa && isMyTurn && (
                  <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDhappa}
                      className="bg-[#D4AF37] text-ink px-8 py-3 rounded-2xl font-black text-xl border border-[#AA8822] shadow-card-lifted uppercase tracking-widest animate-pulse-gold relative overflow-hidden group"
                  >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                      Dhappa!!
                  </motion.button>
              )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 snap-x hide-scrollbar">
              <AnimatePresence>
                  {gameState.hand.map((card, idx) => {
                      // Slight random rotation for paper feel
                      const rotation = (idx % 2 === 0 ? 1 : -1) * (Math.random() * 3);
                      const isSelected = selectedCardId === card.id;

                      return (
                          <motion.div
                              key={card.id}
                              layout
                              initial={{ y: 50, opacity: 0 }}
                              animate={{ 
                                  y: isSelected ? -20 : 0, 
                                  opacity: 1,
                                  rotate: isSelected ? 0 : rotation,
                                  scale: isSelected ? 1.05 : 1
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              exit={{ y: -50, opacity: 0, scale: 0.5 }}
                              whileHover={isMyTurn ? { scale: 1.05, rotate: 0, y: -10 } : {}}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => isMyTurn && setSelectedCardId(card.id)}
                              className={`
                                  snap-center flex-shrink-0 w-28 h-40 bg-paper-light rounded-xl border p-3 flex flex-col justify-center items-center cursor-pointer transition-colors duration-200 relative
                                  ${isSelected ? 'border-accent-gold shadow-card-lifted bg-white' : 'border-ink/10 shadow-paper'}
                              `}
                          >
                              {isSelected && <div className="absolute inset-0 rounded-xl ring-2 ring-accent-gold/50 pointer-events-none"></div>}
                              <span className="font-handwritten text-2xl text-center text-ink font-bold drop-shadow-sm">
                                  {card.name}
                              </span>
                          </motion.div>
                      );
                  })}
              </AnimatePresence>
          </div>

          <motion.button
              whileHover={selectedCardId && isMyTurn ? { scale: 1.02 } : {}}
              whileTap={selectedCardId && isMyTurn ? { scale: 0.95 } : {}}
              onClick={handlePass}
              disabled={!selectedCardId || !isMyTurn}
              className={`w-full py-4 mt-4 rounded-2xl font-serif font-bold tracking-wider text-xl transition-all ${
                  selectedCardId && isMyTurn
                      ? 'bg-ink text-[#D4AF37] shadow-card-lifted' 
                      : 'bg-ink/5 text-ink/30 cursor-not-allowed border border-ink/10 shadow-none'
              }`}
          >
              Pass Selected
          </motion.button>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default GameScreen;
