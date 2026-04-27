import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';

const CoverScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();

  const isMyTurn = gameState.currentTurn === socket?.id;
  const activePlayer = gameState.players.find((p) => p.id === gameState.currentTurn);

  useEffect(() => {
    if (!socket) return;

    // FIX #11: Named handler reference
    const handleHand = (data) => {
      updateGameState({ hand: data.hand });
    };

    // FIX: Also handle dhappa_triggered so the cover screen doesn't get stuck
    const handleDhappaTriggered = (data) => {
      updateGameState({ status: 'slappad', dhappaBy: data.by });
    };

    socket.on('your_hand', handleHand);
    socket.on('dhappa_triggered', handleDhappaTriggered);

    return () => {
      socket.off('your_hand', handleHand);
      socket.off('dhappa_triggered', handleDhappaTriggered);
    };
  }, [socket, updateGameState]);

  const handleReveal = () => {
    // FIX #14: Only allow reveal if we actually have cards
    if (gameState.hand.length > 0) {
      updateGameState({ status: 'playing' });
    }
  };

  return (
    <div className="h-full w-full bg-[#8B6F47] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>
      
      {isMyTurn ? (
        <div className="w-full max-w-sm bg-[#FFF8E7] border-4 border-[#2C1810] p-8 shadow-lg transform rotate-1"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
          <h2 className="text-5xl text-[#2C1810] mb-4" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            It's your turn!
          </h2>
          <p className="text-2xl text-[#8B6F47] mb-8 font-bold">
            Make sure no one is looking at your screen.
          </p>

          <button
            onClick={handleReveal}
            disabled={gameState.hand.length === 0}
            className="w-full bg-[#D2691E] border-4 border-[#2C1810] py-4 text-3xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'Caveat, cursive',
              fontWeight: 700,
              boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)'
            }}
          >
            {gameState.hand.length === 0 ? 'Loading...' : 'Reveal Cards'}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-[#F5E6D3] border-4 border-[#2C1810] p-8 shadow-lg transform -rotate-1"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
          <h2 className="text-5xl text-[#2C1810] mb-4" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            Wait!
          </h2>
          <p className="text-2xl text-[#8B6F47] font-bold">
            Waiting for <span className="font-bold text-[#D2691E] text-3xl block mt-2" style={{ fontFamily: 'Caveat, cursive' }}>{activePlayer?.name}</span>
          </p>
          <p className="mt-6 text-sm text-[#8B6F47] uppercase tracking-widest font-bold">
            They are picking a card...
          </p>
        </div>
      )}
    </div>
  );
};

export default CoverScreen;
