import { useNavigate, useParams } from "react-router";

const MOCK_SCORES = [
  { id: 1, name: "You", thisRound: 1000, total: 2500 },
  { id: 2, name: "Priya", thisRound: -500, total: 1200 },
  { id: 3, name: "Raj", thisRound: 500, total: 1800 },
  { id: 4, name: "Amit", thisRound: -1000, total: 300 },
];

export default function RoundSummaryScreen() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const handleNextRound = () => {
    navigate(`/game/${roomCode}`);
  };

  const handleEndGame = () => {
    navigate(`/results/${roomCode}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#8B6F47] relative overflow-hidden flex items-center justify-center p-6"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      <div className="max-w-md w-full">
        {/* Scorecard */}
        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-8 transform -rotate-1 shadow-lg mb-8"
             style={{
               boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)',
               backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, rgba(210, 105, 30, 0.1) 35px, rgba(210, 105, 30, 0.1) 36px)'
             }}>

          {/* Title */}
          <h1 className="text-4xl text-[#2C1810] text-center mb-6 transform -rotate-1"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            Round Complete!
          </h1>

          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 mb-4 pb-3 border-b-2 border-[#2C1810]">
            <div className="text-lg text-[#2C1810]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
              Player
            </div>
            <div className="text-lg text-[#2C1810] text-center" style={{ fontFamily: 'Patrick Hand, cursive' }}>
              This Round
            </div>
            <div className="text-lg text-[#2C1810] text-right" style={{ fontFamily: 'Patrick Hand, cursive' }}>
              Total
            </div>
          </div>

          {/* Scores */}
          <div className="space-y-3">
            {MOCK_SCORES.sort((a, b) => b.total - a.total).map((player, index) => (
              <div key={player.id} className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <span className="text-2xl">👑</span>
                  )}
                  <span className="text-2xl text-[#2C1810]"
                        style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                    {player.name}
                  </span>
                </div>

                <div className={`text-2xl text-center ${
                  player.thisRound > 0 ? 'text-green-700' : 'text-red-700'
                }`} style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  {player.thisRound > 0 ? '+' : ''}{player.thisRound}
                </div>

                <div className="text-2xl text-[#2C1810] text-right"
                     style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  {player.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleNextRound}
            className="w-full bg-[#D2691E] border-4 border-[#2C1810] px-8 py-5 text-3xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-transform active:scale-95"
            style={{
              fontFamily: 'Caveat, cursive',
              fontWeight: 700,
              transform: 'rotate(-0.5deg)',
              boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.4)'
            }}>
            Next Round
          </button>

          <button
            onClick={handleEndGame}
            className="w-full bg-[#FFF8E7] border-4 border-[#2C1810] px-8 py-4 text-2xl text-[#2C1810] shadow-lg transform hover:scale-105 transition-transform active:scale-95"
            style={{
              fontFamily: 'Caveat, cursive',
              fontWeight: 700,
              transform: 'rotate(0.5deg)',
              boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
            }}>
            End Game
          </button>
        </div>
      </div>
    </div>
  );
}
