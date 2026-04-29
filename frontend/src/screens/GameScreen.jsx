import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import thappaSound from '../soundeffects/thappasoundeffect.mp3';
import passSound from '../soundeffects/passingsoundeffect.mp3';

const GameScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const [selectedCardId, setSelectedCardId] = useState(null);

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
        // Only navigate to cover if it becomes this player's turn
        status: data.playerId === socket.id ? 'cover' : prev.status,
      }));
    };

    const handleHand = (data) => {
      updateGameState({ hand: data.hand });
    };

    const handleDhappaTriggered = (data) => {
      new Audio(thappaSound).play().catch(err => console.log("Audio play failed", err));
      updateGameState({ status: 'slappad', dhappaBy: data.by });
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
    socket.on('game_aborted', handleGameAborted);

    return () => {
      socket.off('turn_start', handleTurnStart);
      socket.off('your_hand', handleHand);
      socket.off('dhappa_triggered', handleDhappaTriggered);
      socket.off('game_aborted', handleGameAborted);
    };
  }, [socket, updateGameState]);

  const handlePass = () => {
    if (!selectedCardId || !isMyTurn) return;
    new Audio(passSound).play().catch(err => console.log("Audio play failed", err));
    socket.emit('pass_card', { roomCode: gameState.roomCode, cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleDhappa = () => {
    if (!canDhappa) return;
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
                  className={`bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-2 shadow-md ${
                    isActive ? 'ring-4 ring-[#D2691E]' : ''
                  }`}
                  style={{
                    transform: `rotate(${[-2, 1, 3, -1][index % 4]}deg)`,
                    boxShadow: isActive
                      ? '0 0 20px rgba(210, 105, 30, 0.6), 4px 4px 0px rgba(44, 24, 16, 0.3)'
                      : '4px 4px 0px rgba(44, 24, 16, 0.3)'
                  }}>
                  <div className="text-lg text-[#2C1810] whitespace-nowrap text-center"
                       style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                    {player?.name}
                  </div>
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

            {canDhappa && (
              <button
                onClick={handleDhappa}
                className="flex-1 bg-[#D2691E] border-4 border-[#2C1810] py-4 text-3xl text-[#FFF8E7] shadow-lg transition-all animate-pulse-glow"
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontWeight: 700,
                  transform: 'rotate(1deg)',
                  boxShadow: '0 0 30px rgba(210, 105, 30, 0.8), 6px 6px 0px rgba(44, 24, 16, 0.3)'
                }}>
                DHAPPA!!
              </button>
            )}
          </div>
        </div>
      </div>

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
        .animate-pulse-glow {
          animation: pulse-glow 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default GameScreen;
