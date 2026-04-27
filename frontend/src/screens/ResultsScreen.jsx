import React from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';

const medals = ['🥇', '🥈', '🥉'];

const ResultsScreen = () => {
  const { gameState, resetGame } = useGame();
  const { socket } = useSocket();

  // Sort players by total score
  const sortedPlayers = [...(gameState?.players || [])].sort(
    (a, b) => (b?.score?.total || 0) - (a?.score?.total || 0)
  );

  const winner = sortedPlayers[0];

  const handlePlayAgain = () => {
    // Reset client-side state back to landing
    resetGame();
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-y-auto bg-paper">
      {/* Hero Section */}
      <div className="relative bg-ink text-paper px-6 pt-16 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              🃏
            </div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-7xl mb-4"
        >
          🏆
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-serif italic font-bold text-[#D4AF37] drop-shadow-lg mb-2"
        >
          Game Over!
        </motion.h1>

        {winner && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-xl text-paper/80"
          >
            <span className="font-bold text-[#D4AF37]">{winner.name}</span> wins with{' '}
            <span className="font-bold">{winner.score?.total || 0}</span> points!
          </motion.p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="px-6 -mt-10">
        <div className="bg-paper rounded-3xl shadow-paper-lifted border border-ink/10 p-6 space-y-4">
          <h2 className="font-bold text-xl border-b border-ink/10 pb-4">Final Leaderboard</h2>

          {sortedPlayers.map((player, idx) => {
            const isMe = player.id === socket?.id;
            const isTop3 = idx < 3;
            return (
              <motion.div
                key={player.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-2xl ${
                  idx === 0
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-paper-light border border-ink/5'
                }`}
              >
                <div className="text-3xl w-10 text-center">
                  {isTop3 ? medals[idx] : <span className="text-lg font-bold text-ink/30">#{idx + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-lg leading-none ${idx === 0 ? 'text-yellow-800' : 'text-ink'}`}>
                    {player.name}
                    {isMe && (
                      <span className="ml-2 text-xs bg-ink/10 px-2 py-0.5 rounded-full font-sans">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50 uppercase tracking-wider font-medium mt-0.5">
                    {gameState.roundsTotal} rounds played
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-2xl ${idx === 0 ? 'text-yellow-700' : 'text-ink'}`}>
                    {player.score?.total || 0}
                  </p>
                  <p className="text-xs text-ink/40 uppercase tracking-wider">pts</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Play Again */}
      <div className="p-6 mt-auto">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayAgain}
          className="w-full flex items-center justify-center gap-3 bg-ink text-paper py-4 rounded-2xl font-serif font-bold text-xl shadow-card-lifted"
        >
          <RotateCcw size={22} />
          Play Again
        </motion.button>
      </div>
    </div>
  );
};

export default ResultsScreen;
