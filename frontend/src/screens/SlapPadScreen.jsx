import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import thappaSound from '../soundeffects/thappasoundeffect.mp3';

const SlapPadScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const [slapped, setSlapped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000);

  const timerRef = useRef(null);

  const isDhappaPlayer = gameState.dhappaBy === socket?.id;
  const me = gameState.players.find((p) => p.id === socket?.id);

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
    new Audio(thappaSound).play().catch(err => console.log("Audio play failed", err));
    socket?.emit('register_slap', {
      roomCode: gameState.roomCode,
      timestamp: Date.now(),
    });
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-center items-center overflow-hidden touch-none ${isDhappaPlayer ? 'bg-[#8B6F47]' : 'bg-gradient-to-br from-[#FFA500] via-[#FF8C00] to-[#FFD700]'}`}>
      
      {/* Timer for non-dhappa players */}
      {!isDhappaPlayer && !slapped && (
        <div className="absolute top-8 left-0 right-0 text-center z-50 pointer-events-none">
           <div className="text-[120px] text-white/50 drop-shadow-lg" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {Math.ceil(timeLeft / 1000)}
           </div>
        </div>
      )}

      {isDhappaPlayer ? (
        // Celebration for Dhappa Player
        <div className="w-full max-w-sm bg-[#FFF8E7] border-4 border-[#2C1810] p-8 shadow-lg transform rotate-1 text-center"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <h2 className="text-5xl text-[#2C1810] mb-4" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            You called DHAPPA!
          </h2>
          <p className="text-2xl text-[#D2691E] font-bold" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            1000 points!
          </p>
          <p className="mt-6 text-sm text-[#8B6F47] uppercase tracking-widest font-bold">
            Waiting for others to slap...
          </p>
        </div>
      ) : (
        // Giant Slap Button for others
        <div className="w-full h-full flex flex-col justify-center items-center p-6 relative">
          <div className="absolute top-4 text-white/80 font-bold text-2xl uppercase tracking-widest" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            {me?.name}
          </div>

          <button
            onPointerDown={handleSlap}
            disabled={slapped}
            className={`w-full h-[60vh] max-w-sm rounded-full border-8 border-[#2C1810] flex items-center justify-center transition-all ${
              slapped ? 'bg-[#FFF8E7] scale-95 shadow-none' : 'bg-[#D2691E] shadow-[0_20px_0_#2C1810] active:translate-y-4 active:shadow-[0_0_0_#2C1810]'
            }`}
            style={{ fontFamily: 'Caveat, cursive', fontWeight: 900 }}
          >
            {slapped ? (
              <span className="text-6xl text-[#2C1810] transform -rotate-12">
                SLAPPED! ✋
              </span>
            ) : (
              <span className="text-[80px] text-[#FFF8E7] animate-pulse drop-shadow-lg">
                SLAP!!
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SlapPadScreen;
