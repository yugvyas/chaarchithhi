import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { EyeOff } from 'lucide-react';

const CoverScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const isMyTurn = gameState.currentTurn === socket.id;
  const activePlayer = gameState.players.find(p => p.id === gameState.currentTurn);

  useEffect(() => {
    if (!socket) return;
    
    // We get 'your_hand' here from the start_game event
    const handleHand = (data) => {
      updateGameState({ hand: data.hand });
    };

    socket.on('your_hand', handleHand);

    return () => {
      socket.off('your_hand', handleHand);
    };
  }, [socket, updateGameState]);

  const handleReveal = () => {
    updateGameState({ status: 'playing' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 text-ink/20"
      >
        <EyeOff size={80} strokeWidth={1.5} />
      </motion.div>

      {isMyTurn ? (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-handwritten font-bold mb-2">It's your turn!</h2>
          <p className="text-ink-light mb-12">Make sure no one is looking at your screen.</p>
          
          <button 
            onClick={handleReveal}
            className="bg-ink text-paper px-8 py-4 rounded-2xl font-bold text-xl shadow-paper-lifted active:scale-95 transition-transform"
          >
            Reveal Cards
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-3xl font-body font-semibold mb-2">Wait!</h2>
          <p className="text-xl text-ink-light">Waiting for <span className="font-bold text-ink">{activePlayer?.name}</span></p>
          <p className="mt-8 text-sm text-ink/50 uppercase tracking-widest">They are picking a card</p>
        </motion.div>
      )}
    </div>
  );
};

export default CoverScreen;
