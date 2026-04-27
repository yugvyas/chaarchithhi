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

    // FIX #11: Named handler reference
    const handleGameStarted = (data) => {
      // FIX #3: Functional updater
      updateGameState((prev) => ({
        status: data.currentTurn === socket?.id ? 'cover' : 'playing',
        turnOrder: data.turnOrder || [],
        currentTurn: data.currentTurn,
        maxPasses: data.maxPasses || 0,
        roundsCurrent: data.roundsCurrent ?? prev.roundsCurrent,
        roundsTotal: data.roundsTotal ?? prev.roundsTotal,
        hand: data.hand || [],
        // Reset per-round fields
        scores: {},
        slapOrder: [],
        stalemate: false,
        dhappaBy: null,
      }));
    };

    socket.on('game_started', handleGameStarted);
    return () => socket.off('game_started', handleGameStarted);
  }, [socket, updateGameState]);

  const handleNextRound = () => {
    socket.emit('start_game', { roomCode: gameState.roomCode });
  };

  // Sort players by total score descending
  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => {
    const aTotal = a?.score?.total || 0;
    const bTotal = b?.score?.total || 0;
    return bTotal - aTotal;
  });

  // FIX #17: Show remaining rounds info
  const roundsLeft = (gameState.roundsTotal || 3) - (gameState.roundsCurrent || 0);

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
                <>
                  Dhappa by{' '}
                  <span className="font-bold text-ink">
                    {gameState.players?.find((p) => p.id === gameState.dhappaBy)?.name || 'Unknown'}
                  </span>
                </>
              )}
            </p>
            {/* FIX #17: Show round progress */}
            <p className="text-sm text-ink/50 mt-2 uppercase tracking-widest font-bold">
              Round {gameState.roundsCurrent} of {gameState.roundsTotal}
            </p>
          </motion.div>
        )}

        {/* Scoreboard */}
        <div className="bg-paper-light rounded-3xl p-6 shadow-paper border border-ink/10">
          <h3 className="font-bold text-xl mb-6 border-b border-ink/10 pb-4">Scores</h3>
          <div className="space-y-4">
            {sortedPlayers.map((player, idx) => {
              const roundScore = player.score?.round || 0;
              const totalScore = player.score?.total || 0;

              const slapRank = gameState?.slapOrder ? gameState.slapOrder.indexOf(player.id) : -1;
              let rankBadge = null;
              if (!gameState?.stalemate) {
                if (player.id === gameState?.dhappaBy) {
                  rankBadge = (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                      Dhappa! 🏆
                    </span>
                  );
                } else if (slapRank > 0) {
                  rankBadge = (
                    <span className="text-xs bg-ink/5 px-2 py-0.5 rounded-full">
                      Slap #{slapRank}
                    </span>
                  );
                } else {
                  rankBadge = (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                      Too slow
                    </span>
                  );
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
                    <p className="text-xs text-ink-light font-medium uppercase tracking-wider">
                      Total: {totalScore}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FIX #17: Show Next Round or final button based on rounds remaining */}
      <div className="mt-8 mb-4">
        {isHost ? (
          roundsLeft > 0 ? (
            <button
              onClick={handleNextRound}
              className="w-full bg-ink text-paper py-4 rounded-xl font-bold text-xl shadow-paper-lifted active:scale-95 transition-transform"
            >
              Next Round ({roundsLeft} left)
            </button>
          ) : (
            <button
              onClick={() => updateGameState({ status: 'results' })}
              className="w-full bg-[#D4AF37] text-ink py-4 rounded-xl font-bold text-xl shadow-paper-lifted active:scale-95 transition-transform"
            >
              See Final Results 🏆
            </button>
          )
        ) : (
          <p className="text-center text-ink-light font-medium py-4">
            Waiting for host...
          </p>
        )}
      </div>
    </div>
  );
};

export default SummaryScreen;
