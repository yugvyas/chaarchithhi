import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';

const SummaryScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const isHost = gameState?.hostId === socket?.id;
  const isDhappaByMe = gameState.dhappaBy === socket?.id;

  React.useEffect(() => {
    if (!socket) return;

    // FIX #11: Named handler reference
    const handleGameStarted = (data) => {
      // FIX #3: Functional updater
      updateGameState((prev) => ({
        status: 'playing',
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

    return () => {
      socket.off('game_started', handleGameStarted);
    };
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
    <div className="min-h-screen w-full bg-[#8B6F47] relative overflow-y-auto flex items-center justify-center p-6"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>
      
      <div className="max-w-md w-full my-8">
        {/* Scorecard */}
        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-6 sm:p-8 transform -rotate-1 shadow-lg mb-8"
             style={{
               boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)',
               backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, rgba(210, 105, 30, 0.1) 35px, rgba(210, 105, 30, 0.1) 36px)'
             }}>

          {/* Title */}
          <h1 className="text-4xl text-[#2C1810] text-center mb-2 transform -rotate-1"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {gameState.stalemate ? 'Stalemate!' : 'Round Complete!'}
          </h1>
          {!gameState.stalemate && (
            <p className="text-center text-[#D2691E] font-bold mb-4" style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.25rem' }}>
              Dhappa by {gameState.players?.find((p) => p.id === gameState.dhappaBy)?.name || 'Unknown'}
            </p>
          )}
          <p className="text-center text-xs text-[#8B6F47] uppercase tracking-widest font-bold mb-6">
             Round {gameState.roundsCurrent} of {gameState.roundsTotal}
          </p>

          {/* Table Header */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 pb-2 border-b-2 border-[#2C1810]">
            <div className="text-lg text-[#2C1810]" style={{ fontFamily: 'Patrick Hand, cursive' }}>Player</div>
            <div className="text-lg text-[#2C1810] text-center" style={{ fontFamily: 'Patrick Hand, cursive' }}>This Round</div>
            <div className="text-lg text-[#2C1810] text-right" style={{ fontFamily: 'Patrick Hand, cursive' }}>Total</div>
          </div>

          {/* Scores */}
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const roundScore = player.score?.round || 0;
              const totalScore = player.score?.total || 0;
              const slapRank = gameState?.slapOrder ? gameState.slapOrder.indexOf(player.id) : -1;
              
              let rankBadge = null;
              if (!gameState?.stalemate) {
                if (player.id === gameState?.dhappaBy) {
                   rankBadge = <span className="text-[10px] bg-[#D2691E] text-[#FFF8E7] px-1 rounded uppercase block leading-none py-0.5 mt-1 border border-[#2C1810]">Dhappa!</span>;
                } else if (slapRank > 0) {
                   rankBadge = <span className="text-[10px] bg-[#8B6F47] text-[#FFF8E7] px-1 rounded uppercase block leading-none py-0.5 mt-1 border border-[#2C1810]">Slap #{slapRank}</span>;
                } else {
                   rankBadge = <span className="text-[10px] bg-red-800 text-white px-1 rounded uppercase block leading-none py-0.5 mt-1 border border-[#2C1810]">Too Slow</span>;
                }
              }

              return (
                <div key={player.id} className="grid grid-cols-3 gap-2 sm:gap-4 items-center border-b border-ink/5 pb-2">
                  <div>
                    <div className="flex items-center gap-1">
                      {index === 0 && <span className="text-xl">👑</span>}
                      {player.hasClownFace && <span className="text-xl">🤡</span>}
                      <span className="text-3xl text-[#2C1810] leading-none" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                        {player.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rankBadge}
                      {player.sittingOutCount > 0 && (
                        <span className="text-[10px] bg-black text-white px-1 rounded uppercase block leading-none py-0.5 mt-1 border border-white">
                          Sitting Out ({player.sittingOutCount})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`text-3xl text-center ${roundScore > 0 ? 'text-green-700' : (roundScore < 0 ? 'text-red-700' : 'text-[#2C1810]')}`} style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    {roundScore > 0 ? '+' : ''}{roundScore}
                  </div>

                  <div className="text-3xl text-[#2C1810] text-right" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    {totalScore}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {isHost ? (
            <div className="flex flex-col gap-4">
              {roundsLeft > 0 ? (
                <button
                  onClick={handleNextRound}
                  className="w-full bg-[#D2691E] border-4 border-[#2C1810] px-8 py-5 text-3xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-transform active:scale-95"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontWeight: 700,
                    transform: 'rotate(-0.5deg)',
                    boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.4)'
                  }}>
                  Next Round ({roundsLeft} left)
                </button>
              ) : (
                <button
                  onClick={() => updateGameState({ status: 'results' })}
                  className="w-full bg-[#FFF8E7] border-4 border-[#2C1810] px-8 py-5 text-3xl text-[#2C1810] shadow-lg transform hover:scale-105 transition-transform active:scale-95"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontWeight: 700,
                    transform: 'rotate(0.5deg)',
                    boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
                  }}>
                  See Final Results 🏆
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-center text-[#2C1810] font-bold py-4 text-2xl animate-pulse" style={{ fontFamily: 'Caveat, cursive' }}>
                Waiting for host...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;
