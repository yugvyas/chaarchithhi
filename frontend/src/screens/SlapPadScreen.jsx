import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import thappaSound from '../soundeffects/thappasoundeffect.mp3';

const SlapPadScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const [slapped, setSlapped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5000); // 5 second window
  const [challengeWindowOpen, setChallengeWindowOpen] = useState(true);
  const [challengeOutcome, setChallengeOutcome] = useState(null); // { type: 'wrong' | 'caught', challengers: [] }
  const [myChallengeStatus, setMyChallengeStatus] = useState(null); // 'challenged' | 'late'

  const timerRef = useRef(null);

  const isDhappaPlayer = gameState.dhappaBy === socket?.id;
  const me = gameState.players.find((p) => p.id === socket?.id);

  useEffect(() => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 5000 - elapsed);
      setTimeLeft(remaining);
      
      if (elapsed >= 5000) {
        setChallengeWindowOpen(false);
        clearInterval(timerRef.current);
      }
    }, 16); // High frequency for smooth bar
    return () => clearInterval(timerRef.current);
  }, []);

  // FIX #2 & #11: Single round_end listener with named reference
  useEffect(() => {
    if (!socket) return;

    const handleRoundEnd = (data) => {
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

    const handleChallengeFailedSummary = (data) => {
      setChallengeOutcome({ type: 'wrong', dhappaBy: data.dhappaBy, challengers: data.challengers });
      updateGameState({ players: data.players });
    };

    const handleChallengeSuccessSummary = (data) => {
      setChallengeOutcome({ type: 'caught', dhappaBy: data.dhappaBy, challengers: data.challengers });
      updateGameState({ players: data.players });
      // The GameScreen handles the status transition back to playing
    };

    const handleDhappaChallenged = (data) => {
      // Visual feedback that someone challenged
    };

    const handleGameAborted = (data) => {
      alert(data.reason);
      updateGameState({ status: 'lobby' });
    };

    socket.on('round_end', handleRoundEnd);
    socket.on('challenge_failed_summary', handleChallengeFailedSummary);
    socket.on('challenge_success_summary', handleChallengeSuccessSummary);
    socket.on('dhappa_challenged', handleDhappaChallenged);
    socket.on('game_aborted', handleGameAborted);

    return () => {
      socket.off('round_end', handleRoundEnd);
      socket.off('challenge_failed_summary', handleChallengeFailedSummary);
      socket.off('challenge_success_summary', handleChallengeSuccessSummary);
      socket.off('dhappa_challenged', handleDhappaChallenged);
      socket.off('game_aborted', handleGameAborted);
    };
  }, [socket, updateGameState]);

  const handleChallenge = () => {
    if (!challengeWindowOpen || myChallengeStatus) return;
    setMyChallengeStatus('challenged');
    socket.emit('challenge_dhappa', { roomCode: gameState.roomCode });
  };

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
        // Giant Choice Buttons for others
        <div className="w-full h-full flex flex-col justify-center items-center p-6 relative bg-black/20">
          
          <div className="text-center mb-12 animate-in slide-in-from-top duration-500">
             <p className="text-4xl text-white font-black drop-shadow-lg uppercase" style={{ fontFamily: 'Caveat, cursive' }}>
                ✋ {gameState.players.find(p => p.id === gameState.dhappaBy)?.name} DID DHAPPA!!
             </p>
             {challengeWindowOpen && !slapped && !myChallengeStatus && (
               <div className="mt-4 bg-[#FFF8E7] border-4 border-black px-4 py-2 inline-block transform -rotate-1">
                  <p className="text-xl text-black font-bold uppercase tracking-tighter" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    Challenge or Slap in {(timeLeft/1000).toFixed(1)}s
                  </p>
                  <div className="w-full h-2 bg-black/10 mt-1 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 transition-all duration-16 linear" style={{ width: `${(timeLeft/5000) * 100}%` }} />
                  </div>
               </div>
             )}
          </div>

          <div className="w-full max-w-sm flex flex-col gap-6">
            {/* Slap Button */}
            <button
              onPointerDown={handleSlap}
              disabled={slapped || challengeOutcome || myChallengeStatus === 'challenged'}
              className={`w-full h-48 rounded-3xl border-8 border-[#2C1810] flex items-center justify-center transition-all ${
                slapped ? 'bg-[#FFF8E7] scale-95 shadow-none' : 'bg-[#D2691E] shadow-[0_15px_0_#2C1810] active:translate-y-4 active:shadow-[0_0_0_#2C1810]'
              } ${(challengeOutcome || myChallengeStatus === 'challenged') ? 'opacity-20 grayscale' : ''}`}
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 900 }}
            >
              <span className="text-6xl text-[#FFF8E7] drop-shadow-lg">
                {slapped ? 'SLAPPED! ✋' : 'SLAP!!'}
              </span>
            </button>

            {/* Challenge Button (only during window) */}
            {(challengeWindowOpen || myChallengeStatus === 'challenged') && !slapped && (
              <button
                onClick={handleChallenge}
                disabled={myChallengeStatus === 'challenged' || challengeOutcome}
                className={`w-full py-6 rounded-3xl border-8 border-black flex flex-col items-center justify-center transition-all ${
                  myChallengeStatus === 'challenged' 
                    ? 'bg-red-800 scale-95 shadow-none opacity-50' 
                    : 'bg-red-600 shadow-[0_12px_0_black] active:translate-y-4 active:shadow-[0_0_0_black] hover:scale-105'
                }`}
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 900 }}
              >
                <span className="text-4xl text-white uppercase tracking-widest">CHALLENGE ⚔️</span>
                <span className="text-sm text-white/80 font-bold uppercase mt-1">High Risk / High Reward</span>
              </button>
            )}
          </div>

          <div className="mt-12 text-white/60 font-bold text-xl uppercase tracking-widest" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            YOU ARE: {me?.name}
          </div>

          {/* Challenge Outcome Overlay */}
          {challengeOutcome && (
             <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className={`p-8 border-8 border-black transform ${challengeOutcome.type === 'caught' ? '-rotate-3 bg-green-500' : 'rotate-3 bg-red-600'} shadow-2xl text-center`}>
                   <h2 className="text-6xl text-white font-black mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                      {challengeOutcome.type === 'caught' ? 'CAUGHT!! 🕵️' : 'WRONG CALL 😬'}
                   </h2>
                   <p className="text-2xl text-white font-bold" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      {challengeOutcome.type === 'caught' 
                        ? `${gameState.players.find(p => p.id === challengeOutcome.dhappaBy)?.name} lost 600 points!` 
                        : "He actually had it! Challengers lost 300 pts."}
                   </p>
                   {challengeOutcome.challengers.includes(socket.id) && (
                      <div className="mt-6 text-7xl animate-bounce">
                         {challengeOutcome.type === 'caught' ? '🏆' : '🤡'}
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlapPadScreen;
