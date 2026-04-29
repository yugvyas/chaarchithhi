import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import thappaSound from '../soundeffects/thappasoundeffect.mp3';
import passSound from '../soundeffects/passingsoundeffect.mp3';

const GameScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [showFalseDhappa, setShowFalseDhappa] = useState(null); // { by: string, name: string }
  const timerIntervalRef = useRef(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // FIX #6: Dhappa is available to ANY player with 4-of-a-kind, not just the turn player
  const nameCounts = {};
  gameState.hand.forEach((c) => {
    nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
  });
  const canDhappa = Object.values(nameCounts).some((count) => count >= 4);

  const isMyTurn = gameState.currentTurn === socket?.id;

  // FIX #8: Stable card rotations — computed once per hand change, not every render
  const [cardRotations] = useState(() => gameState.hand.map((_, idx) => (idx % 2 === 0 ? 1 : -1) * (Math.random() * 3)));
  
  useEffect(() => {
    if (!socket) return;

    // FIX #11: Named handler references
    const handleTurnStart = (data) => {
      // FIX #3: Use functional updater — no stale closure on gameState
      updateGameState((prev) => ({
        currentTurn: data.playerId,
        passCount: data.passCount,
        status: 'playing',
      }));
      
      // Reset timer
      setTimeLeft(10);
    };

    const handleHand = (data) => {
      updateGameState({ hand: data.hand });
    };

    const handleDhappaTriggered = (data) => {
      new Audio(thappaSound).play().catch(err => console.log("Audio play failed", err));
      updateGameState({ status: 'slappad', dhappaBy: data.by });
    };

    const handleFalseDhappa = (data) => {
      const player = data.players.find(p => p.id === data.by);
      setShowFalseDhappa({ by: data.by, name: player?.name });
      updateGameState({ players: data.players });
      setTimeout(() => setShowFalseDhappa(null), 3000);
    };

    const handleChallengeSuccessSummary = (data) => {
      const dhappaPlayer = data.players.find(p => p.id === data.dhappaBy);
      setFeedbackMessage({
        type: 'success',
        title: 'CAUGHT!! 🕵️',
        text: `${dhappaPlayer?.name} had a dirty hand! Round resumes.`,
      });
      updateGameState({ players: data.players, status: 'playing', dhappaBy: null });
      setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleChallengeFailedSummary = (data) => {
      updateGameState({ players: data.players });
      // The actual round end will follow
    };

    const handleSettingsUpdated = (data) => {
      updateGameState({ settings: data.settings });
    };

    const handlePlayerSkipped = (data) => {
      const player = gameStateRef.current.players?.find(p => p.id === data.playerId);
      setFeedbackMessage({
        type: 'info',
        title: 'SKIPPED!',
        text: `${player?.name || 'Someone'} is sitting out (${data.sittingOutCount} left).`,
      });
      setTimeout(() => setFeedbackMessage(null), 2000);
    };

    // FIX #2: GameScreen no longer listens for round_end.
    // Only SlapPadScreen handles round_end to avoid duplicate/racing handlers.

    const handleGameAborted = (data) => {
      alert(data.reason); // Simple alert; could be a modal
      updateGameState({ status: 'lobby' });
    };

    socket.on('turn_start', handleTurnStart);
    socket.on('your_hand', handleHand);
    socket.on('dhappa_triggered', handleDhappaTriggered);
    socket.on('false_dhappa', handleFalseDhappa);
    socket.on('challenge_success_summary', handleChallengeSuccessSummary);
    socket.on('challenge_failed_summary', handleChallengeFailedSummary);
    socket.on('settings_updated', handleSettingsUpdated);
    socket.on('player_skipped', handlePlayerSkipped);
    socket.on('game_aborted', handleGameAborted);

    return () => {
      socket.off('turn_start', handleTurnStart);
      socket.off('your_hand', handleHand);
      socket.off('dhappa_triggered', handleDhappaTriggered);
      socket.off('false_dhappa', handleFalseDhappa);
      socket.off('challenge_success_summary', handleChallengeSuccessSummary);
      socket.off('challenge_failed_summary', handleChallengeFailedSummary);
      socket.off('settings_updated', handleSettingsUpdated);
      socket.off('player_skipped', handlePlayerSkipped);
      socket.off('game_aborted', handleGameAborted);
    };
  }, [socket, updateGameState]);

  // Timer countdown logic
  useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState.currentTurn]);

  const handlePass = () => {
    if (!selectedCardId || !isMyTurn) return;
    new Audio(passSound).play().catch(err => console.log("Audio play failed", err));
    socket.emit('pass_card', { roomCode: gameState.roomCode, cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleDhappa = () => {
    // Riskier: always allow trigger
    socket.emit('trigger_dhappa', { roomCode: gameState.roomCode });
  };

  const passesRemaining = gameState.maxPasses - gameState.passCount;
  const isUrgent = passesRemaining <= 10;

  // FIX #13: Show the player's objective (which name to collect)

  // The name they need 4 of is whichever name they have the most of right now
  const targetName = Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="h-full w-full bg-[#8B6F47] relative overflow-hidden flex flex-col"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      {/* Header Info - Passes & Objective */}
      <div className="flex justify-between items-start p-6 z-10">
        {/* Left: Objective */}
        {targetName ? (
          <div className="bg-[#FFF8E7] border-3 border-[#2C1810] px-4 py-2 transform -rotate-2 shadow-lg"
               style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)' }}>
            <div className="text-xs text-[#8B6F47] uppercase tracking-widest font-bold">
              Collect 4
            </div>
            <div className="text-2xl text-[#D2691E] text-center" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {targetName}
            </div>
          </div>
        ) : <div />}

        {/* Right: Passes */}
        <div className={`bg-[#FFF8E7] border-3 ${isUrgent ? 'border-red-600 animate-pulse' : 'border-[#2C1810]'} px-6 py-2 transform rotate-3 shadow-lg`}
             style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)' }}>
          <div className="text-xs text-[#8B6F47] uppercase tracking-widest font-bold text-center">
            Passes
          </div>
          <div className={`text-3xl ${isUrgent ? 'text-red-600' : 'text-[#2C1810]'} text-center`} style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {gameState.passCount}
            <span className="text-sm text-[#8B6F47]">/{gameState.maxPasses}</span>
          </div>
        </div>
      </div>

      {/* Player Circle - Center */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-64 h-64">
          {/* Center wooden surface */}
          <div className="absolute inset-0 rounded-full bg-[#654321] opacity-40 blur-xl"></div>

          {/* Table text inside center */}
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="font-serif italic text-[#FFF8E7]/30 text-2xl transform -rotate-12 tracking-widest pointer-events-none">
               Table
             </span>
          </div>

          {/* Players positioned in circle */}
          {gameState.turnOrder.map((playerId, index) => {
            const player = gameState.players.find((p) => p.id === playerId);
            const isActive = gameState.currentTurn === playerId;
            const angle = (index / gameState.turnOrder.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 95;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={playerId}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isActive ? 'scale-110 z-10' : 'scale-100 z-0'
                }`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}>
                <div
                  className={`relative bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-2 shadow-md overflow-hidden transition-all duration-300 ${
                    isActive ? 'ring-4 ring-[#D2691E]/50' : ''
                  } ${player?.sittingOutCount > 0 ? 'grayscale opacity-50' : ''}`}
                  style={{
                    transform: `rotate(${[-2, 1, 3, -1][index % 4]}deg)`,
                    boxShadow: isActive
                      ? '0 0 20px rgba(210, 105, 30, 0.4), 4px 4px 0px rgba(44, 24, 16, 0.3)'
                      : '4px 4px 0px rgba(44, 24, 16, 0.3)'
                  }}>
                  
                  {/* Turn Timer Progress Border */}
                  {isActive && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-[#D2691E] transition-all duration-1000 ease-linear"
                      style={{ width: `${(timeLeft / 10) * 100}%` }}
                    />
                  )}
                  {isActive && (
                    <div 
                      className="absolute top-0 left-0 w-full h-full border-[6px] border-[#D2691E] opacity-20 pointer-events-none"
                      style={{ 
                        clipPath: `inset(0 ${100 - (timeLeft / 10) * 100}% 0 0)` 
                      }}
                    />
                  )}

                  <div className="text-lg text-[#2C1810] whitespace-nowrap text-center relative z-10"
                       style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                    {player?.name}
                    {isActive && (
                      <span className="ml-2 text-xs opacity-60 font-mono">
                        {timeLeft}s
                      </span>
                    )}
                  </div>
                  {(player?.sittingOutCount > 0) && (
                    <div className="absolute top-0 left-0 w-full h-full bg-red-600/10 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] bg-red-600 text-white px-1 font-bold uppercase tracking-tighter transform -rotate-12">
                        SITTING OUT
                      </span>
                      <span className="text-[8px] font-bold text-red-800">{player.sittingOutCount} turns</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hand of Cards - Bottom */}
      <div className={`pb-8 px-6 transition-all duration-500 ${isMyTurn ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-8 pointer-events-none'}`}>
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h3 className="text-2xl text-[#FFF8E7] text-center mb-4"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              Your Hand
            </h3>

            {/* Cards fanned out */}
            <div className="relative h-44 flex items-end justify-center mb-2">
              {gameState.hand.map((card, index) => {
                const totalCards = gameState.hand.length;
                const fanRotation = ((index - (totalCards - 1) / 2) * 5);
                const rotation = fanRotation + (cardRotations[index] ?? 0); // Keep jitter + fan out
                const offset = (index - (totalCards - 1) / 2) * 65;
                const isSelected = selectedCardId === card.id;

                return (
                  <button
                    key={card.id}
                    onClick={() => isMyTurn && setSelectedCardId(card.id)}
                    className={`absolute bg-[#FFF8E7] border-[3px] border-[#2C1810] w-[95px] h-[135px] sm:w-[110px] sm:h-[150px] shadow-lg transition-all flex flex-col items-center justify-center p-2 ${
                      isSelected ? '-translate-y-6 scale-110 ring-4 ring-[#D2691E]' : 'hover:-translate-y-3'
                    }`}
                    style={{
                      transform: `translateX(${offset}px) rotate(${rotation}deg) ${isSelected ? 'translateY(-24px) scale(1.1)' : ''}`,
                      boxShadow: isSelected
                        ? '0 0 20px rgba(210, 105, 30, 0.6), 6px 6px 0px rgba(44, 24, 16, 0.4)'
                        : '6px 6px 0px rgba(44, 24, 16, 0.3)',
                      zIndex: isSelected ? 10 : totalCards - Math.abs(index - (totalCards - 1) / 2)
                    }}>
                    <div className="text-[1.35rem] text-[#2C1810] text-center leading-none break-words w-full"
                         style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      {card.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePass}
              disabled={!selectedCardId || !isMyTurn}
              className="flex-1 bg-[#FFF8E7] border-4 border-[#2C1810] py-4 text-3xl text-[#2C1810] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform active:scale-95"
              style={{
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                transform: 'rotate(-1deg)',
                boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
              }}>
              PASS
            </button>

            <button
              onClick={handleDhappa}
              className={`flex-1 border-4 border-[#2C1810] py-4 text-3xl shadow-lg transition-all ${
                canDhappa 
                  ? 'bg-[#D2691E] text-[#FFF8E7] animate-pulse-glow' 
                  : 'bg-[#D2691E]/60 text-[#FFF8E7]/60'
              }`}
              style={{
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                transform: 'rotate(1deg)',
                boxShadow: canDhappa 
                  ? '0 0 30px rgba(210, 105, 30, 0.8), 6px 6px 0px rgba(44, 24, 16, 0.3)'
                  : '6px 6px 0px rgba(44, 24, 16, 0.3)'
              }}>
              DHAPPA!!
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-md pointer-events-none">
          <div className={`bg-[#FFF8E7] border-4 border-[#2C1810] p-6 shadow-2xl text-center transform ${feedbackMessage.type === 'error' ? 'rotate-2' : '-rotate-2'} animate-in slide-in-from-bottom duration-500`}
               style={{ boxShadow: '10px 10px 0px rgba(44, 24, 16, 0.4)' }}>
            <h2 className={`text-4xl mb-2 ${feedbackMessage.type === 'error' ? 'text-red-600' : feedbackMessage.type === 'success' ? 'text-green-600' : 'text-[#D2691E]'}`}
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {feedbackMessage.title}
            </h2>
            <p className="text-xl text-[#2C1810]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
              {feedbackMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* False Dhappa Flash Overlay */}
      {showFalseDhappa && (
        <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center animate-pulse-fast p-8 text-center">
           <h1 className="text-6xl sm:text-8xl text-white font-black mb-8 transform -rotate-6 scale-110 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
               style={{ fontFamily: 'Caveat, cursive' }}>
             JHOOTHA DHAPPA!! 🤡
           </h1>
           <div className="bg-white border-8 border-black p-6 transform rotate-3 shadow-2xl">
              <p className="text-3xl text-red-600 font-bold uppercase tracking-tighter">
                {showFalseDhappa.by === socket.id ? "YOU FAKED IT!" : `${showFalseDhappa.name} LIED!`}
              </p>
              <p className="text-xl text-black mt-2 font-mono">
                -500 POINTS | HAND RESET | 2 TURNS SKIP
              </p>
           </div>
           
           {/* Laughing Animation (Emoji) */}
           <div className="mt-12 text-9xl animate-bounce">
              😂
           </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: rotate(1deg) scale(1);
            box-shadow: 0 0 30px rgba(210, 105, 30, 0.8), 6px 6px 0px rgba(44, 24, 16, 0.3);
          }
          50% {
            transform: rotate(1deg) scale(1.08);
            box-shadow: 0 0 50px rgba(255, 140, 0, 1), 6px 6px 0px rgba(44, 24, 16, 0.3);
          }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.5s infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.2s infinite;
        }
      `}</style>
    </div>
  );
};

export default GameScreen;
