import { useState } from "react";
import { useNavigate, useParams } from "react-router";

const MOCK_PLAYERS = [
  { id: 1, name: "You", chit: "Raaja", position: 0 },
  { id: 2, name: "Priya", chit: "Mantri", position: 1 },
  { id: 3, name: "Raj", chit: "Chor", position: 2 },
  { id: 4, name: "Amit", chit: "Sipahi", position: 3 },
];

const MOCK_HAND = ["Raaja", "Mantri", "Chor", "Sipahi"];

export default function GameScreen() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [passCount, setPassCount] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [selectedChit, setSelectedChit] = useState<number | null>(null);
  const [dhappaActive, setDhappaActive] = useState(false);

  const handlePass = () => {
    if (selectedChit !== null) {
      setPassCount(prev => prev + 1);
      setCurrentTurn((prev) => (prev + 1) % 4);
      setSelectedChit(null);

      // Simulate dhappa activation after 8 passes
      if (passCount >= 7) {
        setTimeout(() => {
          setDhappaActive(true);
          setTimeout(() => navigate(`/dhappa/${roomCode}`), 500);
        }, 1000);
      }
    }
  };

  const handleDhappa = () => {
    navigate(`/dhappa/${roomCode}`);
  };

  return (
    <div className="h-screen w-full bg-[#8B6F47] relative overflow-hidden flex flex-col"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      {/* Pass Counter - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-[#FFF8E7] border-3 border-[#2C1810] px-6 py-3 transform rotate-3 shadow-lg"
             style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)' }}>
          <div className="text-sm text-[#8B6F47]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            Passes
          </div>
          <div className="text-3xl text-[#2C1810] text-center" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {passCount}
          </div>
        </div>
      </div>

      {/* Player Circle - Center */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-64 h-64">
          {/* Center wooden surface */}
          <div className="absolute inset-0 rounded-full bg-[#654321] opacity-40 blur-xl"></div>

          {/* Players positioned in circle */}
          {MOCK_PLAYERS.map((player, index) => {
            const angle = (index * 90 - 45) * (Math.PI / 180);
            const radius = 120;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isCurrentTurn = currentTurn === index;

            return (
              <div
                key={player.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isCurrentTurn ? 'scale-110' : 'scale-100'
                }`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}>
                <div
                  className={`bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-2 shadow-md ${
                    isCurrentTurn ? 'ring-4 ring-[#D2691E]' : ''
                  }`}
                  style={{
                    transform: `rotate(${[-2, 1, 3, -1][index]}deg)`,
                    boxShadow: isCurrentTurn
                      ? '0 0 20px rgba(210, 105, 30, 0.6), 4px 4px 0px rgba(44, 24, 16, 0.3)'
                      : '4px 4px 0px rgba(44, 24, 16, 0.3)'
                  }}>
                  <div className="text-lg text-[#2C1810] whitespace-nowrap text-center"
                       style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                    {player.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hand of Cards - Bottom */}
      <div className="pb-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h3 className="text-2xl text-[#FFF8E7] text-center mb-4"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              Your Hand
            </h3>

            {/* Cards fanned out */}
            <div className="relative h-32 flex items-end justify-center">
              {MOCK_HAND.map((chit, index) => {
                const totalCards = MOCK_HAND.length;
                const rotation = ((index - (totalCards - 1) / 2) * 5);
                const offset = (index - (totalCards - 1) / 2) * 70;
                const isSelected = selectedChit === index;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedChit(index)}
                    className={`absolute bg-[#FFF8E7] border-3 border-[#2C1810] px-6 py-8 shadow-lg transition-all ${
                      isSelected ? '-translate-y-6 scale-110 ring-4 ring-[#D2691E]' : 'hover:-translate-y-3'
                    }`}
                    style={{
                      transform: `translateX(${offset}px) rotate(${rotation}deg) ${isSelected ? 'translateY(-24px) scale(1.1)' : ''}`,
                      boxShadow: isSelected
                        ? '0 0 20px rgba(210, 105, 30, 0.6), 6px 6px 0px rgba(44, 24, 16, 0.4)'
                        : '6px 6px 0px rgba(44, 24, 16, 0.3)',
                      zIndex: isSelected ? 10 : totalCards - Math.abs(index - (totalCards - 1) / 2)
                    }}>
                    <div className="text-2xl text-[#2C1810]"
                         style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      {chit}
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
              disabled={selectedChit === null || currentTurn !== 0}
              className="flex-1 bg-[#FFF8E7] border-4 border-[#2C1810] py-5 text-3xl text-[#2C1810] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform active:scale-95"
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
              disabled={!dhappaActive}
              className={`flex-1 bg-[#D2691E] border-4 border-[#2C1810] py-5 text-3xl text-[#FFF8E7] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                dhappaActive ? 'animate-pulse-glow' : ''
              }`}
              style={{
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                transform: 'rotate(1deg)',
                boxShadow: dhappaActive
                  ? '0 0 30px rgba(210, 105, 30, 0.8), 6px 6px 0px rgba(44, 24, 16, 0.3)'
                  : '6px 6px 0px rgba(44, 24, 16, 0.3)'
              }}>
              DHAPPA!!
            </button>
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
}
