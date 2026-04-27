import { useState } from "react";
import { useNavigate, useParams } from "react-router";

const CHIT_NAMES = ["Raaja", "Mantri", "Chor", "Sipahi"];

export default function RoomLobbyScreen() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app this would come from backend
  const [players, setPlayers] = useState([
    { id: 1, name: "You", chit: "Raaja" },
    { id: 2, name: "Priya", chit: "Mantri" },
    { id: 3, name: "Raj", chit: "Chor" },
  ]);

  const handleStartGame = () => {
    navigate(`/game/${roomCode}`);
  };

  return (
    <div className="h-screen w-full bg-[#8B6F47] relative overflow-hidden flex flex-col items-center justify-between p-8"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      {/* Room Code Display */}
      <div className="w-full max-w-md">
        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-6 text-center transform -rotate-1 shadow-lg"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
          <div className="text-lg text-[#8B6F47] mb-2" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            Room Code
          </div>
          <div className="text-5xl text-[#2C1810] tracking-widest" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {roomCode}
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-4 py-8">
        <h2 className="text-3xl text-[#FFF8E7] mb-4" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
          Players Waiting...
        </h2>

        <div className="w-full space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="bg-[#F5E6D3] border-3 border-[#2C1810] p-4 flex items-center justify-between shadow-md"
              style={{
                transform: `rotate(${[-1, 1, -0.5, 0.5][index % 4]}deg)`,
                boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)'
              }}>
              <span className="text-2xl text-[#2C1810]" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {player.name}
              </span>
              <div className="bg-[#FFF8E7] border-2 border-[#2C1810] px-4 py-2 transform rotate-2">
                <span className="text-xl text-[#D2691E]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  {player.chit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {players.length < 4 && (
          <div className="text-xl text-[#FFF8E7] opacity-70 mt-4" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            Waiting for {4 - players.length} more player{4 - players.length > 1 ? 's' : ''}...
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="w-full max-w-md">
        <button
          onClick={handleStartGame}
          disabled={players.length < 4}
          className="w-full bg-[#D2691E] border-4 border-[#2C1810] px-8 py-6 text-4xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            fontFamily: 'Caveat, cursive',
            fontWeight: 700,
            transform: 'rotate(-0.5deg)',
            boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.4)',
            animation: players.length >= 4 ? 'pulse 2s infinite' : 'none'
          }}>
          Start Game!
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: rotate(-0.5deg) scale(1); }
          50% { transform: rotate(-0.5deg) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
