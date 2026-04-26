import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { Trophy, AlertTriangle } from 'lucide-react';

const SummaryScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const isHost = gameState?.hostId === socket?.id;

  React.useEffect(() => {
    if (!socket) return;
    const handleGameStarted = (data) => {
      updateGameState({
        status: data.currentTurn === socket?.id ? 'cover' : 'playing',
        turnOrder: data.turnOrder || [],
        currentTurn: data.currentTurn,
        maxPasses: data.maxPasses || 0,
        hand: data.hand || []
      });
    };
    socket.on('game_started', handleGameStarted);
    return () => socket.off('game_started', handleGameStarted);
  }, [socket, updateGameState]);

  const handleNextRound = () => {
    // In a full game, we'd trigger a new round here.
    // For this prototype, we'll just restart the game to show the loop.
    socket.emit('start_game', { roomCode: gameState.roomCode });
  };

  // Sort players by total score descending
  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => {
      const aTotal = a?.score?.total || 0;
      const bTotal = b?.score?.total || 0;
      return bTotal - aTotal;
  });

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center py-8">
        {gameState.stalemate ? (
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="text-center mb-10"
           >
              <AlertTriangle size={64} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-4xl font-handwritten font-bold text-ink mb-2">Stalemate!</h2>
              <p className="text-ink-light">Max passes reached. Nobody wins this round.</p>
           </motion.div>
        ) : (
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="text-center mb-10"
           >
              <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-4xl font-handwritten font-bold text-ink mb-2">Round Over</h2>
              <p className="text-ink-light">
                 {gameState?.dhappaBy && (
                    <>Dhappa by <span className="font-bold text-ink">{gameState.players?.find(p => p.id === gameState.dhappaBy)?.name || 'Unknown'}</span></>
                 )}
              </p>
           </motion.div>
        )}

        <div className="bg-paper-light rounded-3xl p-6 shadow-paper border border-ink/10">
           <h3 className="font-bold text-xl mb-6 border-b border-ink/10 pb-4">Scores</h3>
           
           <div className="space-y-4">
              {sortedPlayers.map((player, idx) => {
                 const roundScore = player.score?.round || 0;
                 const totalScore = player.score?.total || 0;
                 
                 // Find ranking in slap order
                 const slapRank = gameState?.slapOrder ? gameState.slapOrder.indexOf(player.id) : -1;
                 let rankBadge = null;
                 if (!gameState?.stalemate) {
                     if (player.id === gameState?.dhappaBy) {
                        rankBadge = <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">Dhappa!</span>;
                     } else if (slapRank !== -1 && slapRank > 0) {
                        rankBadge = <span className="text-xs bg-ink/5 px-2 py-0.5 rounded-full">Slap #{slapRank}</span>;
                     } else {
                        rankBadge = <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Too slow</span>;
                     }
                 }

                 return (
                    <motion.div 
                       key={player.id}
                       initial={{ x: -20, opacity: 0 }}
                       animate={{ x: 0, opacity: 1 }}
                       transition={{ delay: idx * 0.1 }}
                       className="flex items-center justify-between"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center font-bold text-sm">
                             {idx + 1}
                          </div>
                          <div>
                             <p className="font-bold text-lg leading-none">{player.name}</p>
                             {rankBadge}
                          </div>
                       </div>
                       
                       <div className="text-right">
                          <p className="font-black text-xl text-ink">+{roundScore}</p>
                          <p className="text-xs text-ink-light font-medium uppercase tracking-wider">Total: {totalScore}</p>
                       </div>
                    </motion.div>
                 )
              })}
           </div>
        </div>
      </div>

      <div className="mt-8 mb-4">
         {isHost ? (
            <button
               onClick={handleNextRound}
               className="w-full bg-ink text-paper py-4 rounded-xl font-bold text-xl shadow-paper-lifted active:scale-95 transition-transform"
            >
               Next Round
            </button>
         ) : (
            <p className="text-center text-ink-light font-medium py-4">Waiting for host to start next round...</p>
         )}
      </div>
    </div>
  );
};

export default SummaryScreen;
