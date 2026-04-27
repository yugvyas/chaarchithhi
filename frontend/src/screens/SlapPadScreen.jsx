import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';

const SlapPadScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const [slapped, setSlapped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000);

  const timerRef = useRef(null);

  const isDhappaPlayer = gameState.dhappaBy === socket?.id;
  const dhappaPlayerName = gameState.players.find((p) => p.id === gameState.dhappaBy)?.name;

  useEffect(() => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 3000 - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(timerRef.current);
    }, 50);
    return () => clearInterval(timerRef.current);
  }, []);

  // FIX #2 & #11: Single round_end listener with named reference
  useEffect(() => {
    if (!socket) return;

    const handleRoundEnd = (data) => {
      // FIX #3: Functional updater to avoid stale closure
      updateGameState((prev) => ({
        status: data.isGameOver ? 'results' : 'summary',
        scores: data.scores || {},
        players: data.players || prev.players,
        slapOrder: data.slapOrder || [],
        stalemate: data.stalemate || false,
        isGameOver: data.isGameOver || false,
        roundsCurrent: data.roundsCurrent ?? prev.roundsCurrent,
        roundsTotal: data.roundsTotal ?? prev.roundsTotal,
      }));
    };

    const handleGameAborted = (data) => {
      alert(data.reason);
      updateGameState({ status: 'lobby' });
    };

    socket.on('round_end', handleRoundEnd);
    socket.on('game_aborted', handleGameAborted);
    return () => {
      socket.off('round_end', handleRoundEnd);
      socket.off('game_aborted', handleGameAborted);
    };
  }, [socket, updateGameState]);

  const handleSlap = (e) => {
    e.preventDefault();
    if (slapped || isDhappaPlayer) return;
    setSlapped(true);
    socket?.emit('register_slap', {
      roomCode: gameState.roomCode,
      timestamp: Date.now(),
    });
  };

  const otherPlayers = gameState.players.filter((p) => p.id !== gameState.dhappaBy);
  const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink text-paper touch-none"
      onPointerDown={handleSlap}
    >
      {/* Flash Effect */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
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

        {/* FIX #9: Dhappa player sees a clear winner screen, not a blank one */}
        {isDhappaPlayer ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-col items-center gap-3"
          >
            <span className="text-6xl">🏆</span>
            <p className="text-3xl font-black text-yellow-400 uppercase tracking-wider">
              You called it!
            </p>
            <p className="text-lg text-paper/70">Waiting for others to slap...</p>
          </motion.div>
        ) : (
          <>
            {!slapped && (
              <div className="mt-8">
                <p className="text-3xl font-bold uppercase animate-pulse">Slap the screen!</p>
                <div className="w-full max-w-xs bg-ink-light rounded-full h-4 mt-4 overflow-hidden border border-ink">
                  <div
                    className="bg-yellow-400 h-full transition-all"
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
                ✅ SLAP RECORDED!
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Slap Zones (Visual) */}
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

      <div className="absolute inset-0 z-0 bg-transparent" />
    </div>
  );
};

export default SlapPadScreen;
