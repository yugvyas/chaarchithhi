import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';

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

  const [confettiPieces] = useState(() => 
    [...Array(30)].map((_, i) => ({
      id: i,
      width: `${Math.random() * 20 + 10}px`,
      height: `${Math.random() * 30 + 15}px`,
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 20}%`,
      transform: `rotate(${Math.random() * 360}deg)`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${Math.random() * 2 + 3}s`,
      opacity: 0.7,
      backgroundColor: ['#FFF8E7', '#F5E6D3', '#FFD93D', '#FF9A56'][Math.floor(Math.random() * 4)]
    }))
  );

  return (
    <div className="min-h-screen w-full bg-[#8B6F47] relative overflow-hidden flex flex-col items-center justify-center p-6"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      {/* Confetti - Paper chits falling */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute border-2 border-[#2C1810] animate-confetti"
            style={piece}
          />
        ))}
      </div>

      <div className="max-w-md w-full z-10 my-8 overflow-y-auto hide-scrollbar flex-1 flex flex-col justify-center">
        {/* Winner Announcement */}
        {winner && (
          <div className="mb-8 text-center mt-auto">
            <div className="text-6xl mb-2 animate-bounce">🎉</div>
            <h1 className="text-6xl text-[#FFF8E7] mb-3 transform -rotate-2 drop-shadow-lg"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              Winner!
            </h1>
            <div className="bg-[#FFD93D] border-4 border-[#2C1810] px-10 py-6 inline-block transform rotate-2 shadow-lg"
                 style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.4)' }}>
              <div className="text-6xl text-[#2C1810]"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {winner.name}
              </div>
            </div>
          </div>
        )}

        {/* Final Scoreboard */}
        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-6 sm:p-8 transform -rotate-1 shadow-lg mb-8"
             style={{
               boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)',
               backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, rgba(210, 105, 30, 0.1) 35px, rgba(210, 105, 30, 0.1) 36px)'
             }}>

          {/* Title */}
          <h2 className="text-4xl text-[#2C1810] text-center mb-6"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            Final Scores
          </h2>

          {/* Scores */}
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const isMe = player.id === socket?.id;
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between pb-3 border-b-2 border-[#2C1810] last:border-b-0">

                  <div className="flex items-center gap-3">
                    <div className="text-3xl w-10 text-center"
                         style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '4th'}
                    </div>
                    <span className="text-3xl text-[#2C1810]"
                          style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                      {player.name}
                      {isMe && <span className="text-sm bg-[#D2691E] text-[#FFF8E7] px-2 py-1 rounded ml-2 uppercase tracking-widest font-bold align-middle border border-[#2C1810]">You</span>}
                    </span>
                  </div>

                  <div className="text-4xl text-[#D2691E]"
                       style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    {player.score?.total || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-auto">
          <button
            onClick={handlePlayAgain}
            className="w-full bg-[#D2691E] border-4 border-[#2C1810] px-8 py-5 text-3xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-transform active:scale-95"
            style={{
              fontFamily: 'Caveat, cursive',
              fontWeight: 700,
              transform: 'rotate(-0.5deg)',
              boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.4)'
            }}>
            Back to Menu
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0.3;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ResultsScreen;
