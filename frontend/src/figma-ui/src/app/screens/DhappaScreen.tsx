import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

const PLAYER_COLORS = [
  "#FFD93D", // Warm yellow
  "#FF9A56", // Warm orange
  "#FF6B9D", // Warm pink
  "#A8E6CF", // Warm mint
];

const MOCK_PLAYERS = [
  { id: 1, name: "You", color: PLAYER_COLORS[0] },
  { id: 2, name: "Priya", color: PLAYER_COLORS[1] },
  { id: 3, name: "Raj", color: PLAYER_COLORS[2] },
  { id: 4, name: "Amit", color: PLAYER_COLORS[3] },
];

export default function DhappaScreen() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [slapTimes, setSlapTimes] = useState<Record<number, number>>({});
  const [countdown, setCountdown] = useState(3);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Countdown before activation
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsActive(true);
      // Auto-navigate after 5 seconds
      const endTimer = setTimeout(() => {
        navigate(`/summary/${roomCode}`);
      }, 5000);
      return () => clearTimeout(endTimer);
    }
  }, [countdown, navigate, roomCode]);

  const handleSlap = (playerId: number) => {
    if (isActive && !slapTimes[playerId]) {
      setSlapTimes(prev => ({
        ...prev,
        [playerId]: Date.now()
      }));
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Explosive background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFA500] via-[#FF8C00] to-[#FFD700]"></div>

      {/* Countdown overlay */}
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="text-[200px] text-white animate-bounce"
               style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {countdown}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <h1 className="text-5xl text-white drop-shadow-lg transform -rotate-2 animate-pulse"
            style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
          SLAP YOUR ZONE!!
        </h1>
      </div>

      {/* Player zones in grid */}
      <div className="h-full grid grid-cols-2 grid-rows-2 gap-1 p-1">
        {MOCK_PLAYERS.map((player, index) => {
          const hasSlapped = !!slapTimes[player.id];
          const slappedOrder = Object.keys(slapTimes).length > 0
            ? Object.entries(slapTimes)
                .sort(([, timeA], [, timeB]) => timeA - timeB)
                .findIndex(([id]) => Number(id) === player.id) + 1
            : null;

          return (
            <button
              key={player.id}
              onClick={() => handleSlap(player.id)}
              disabled={!isActive || hasSlapped}
              className="relative w-full h-full border-4 border-[#2C1810] transition-all active:scale-95 disabled:cursor-not-allowed"
              style={{
                backgroundColor: player.color,
                opacity: hasSlapped ? 0.7 : 1,
              }}>

              {/* Player name */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl text-[#2C1810] mb-4 transform"
                     style={{
                       fontFamily: 'Caveat, cursive',
                       fontWeight: 700,
                       transform: `rotate(${[-3, 2, -2, 3][index]}deg)`
                     }}>
                  {player.name}
                </div>

                {/* Slapped indicator */}
                {hasSlapped && slappedOrder !== null && (
                  <div className="bg-white border-4 border-[#2C1810] px-8 py-4 shadow-lg transform rotate-6">
                    <div className="text-4xl text-[#2C1810]"
                         style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      #{slappedOrder}
                    </div>
                  </div>
                )}

                {/* Tap indicator for active zone */}
                {!hasSlapped && isActive && player.id === 1 && (
                  <div className="text-3xl text-[#2C1810] animate-bounce mt-4"
                       style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    TAP HERE!
                  </div>
                )}
              </div>

              {/* Explosion effect on slap */}
              {hasSlapped && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-white animate-ping opacity-50"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Decorative paper chits flying around */}
      <div className="absolute top-20 left-10 w-12 h-16 bg-[#FFF8E7] border-2 border-[#2C1810] transform rotate-12 animate-float opacity-50"></div>
      <div className="absolute top-40 right-16 w-10 h-14 bg-[#F5E6D3] border-2 border-[#2C1810] transform -rotate-45 animate-float-delayed opacity-50"></div>
      <div className="absolute bottom-32 left-20 w-14 h-12 bg-[#FFF8E7] border-2 border-[#2C1810] transform rotate-90 animate-float opacity-50"></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(30deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(-45deg); }
          50% { transform: translateY(-30px) rotate(-60deg); }
        }
        .animate-float {
          animation: float 3s infinite ease-in-out;
        }
        .animate-float-delayed {
          animation: float-delayed 3s infinite ease-in-out 1s;
        }
      `}</style>
    </div>
  );
}
