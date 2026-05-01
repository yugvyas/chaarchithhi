import { useState, useEffect } from "react";
import { useGame } from '../context/GameContext';
import { supabase } from '../supabase';
import { getRank } from '../ranks';

export default function LeaderboardScreen() {
  const { updateGameState } = useGame();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar, rating, level')
        .order('rating', { ascending: false })
        .limit(50);
        
      if (data) setLeaders(data);
      setLoading(false);
    };
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="h-full w-full bg-[#8B6F47] relative overflow-y-auto p-6 py-12"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      <div className="max-w-md mx-auto">
        <button
          onClick={() => updateGameState({ status: 'landing' })}
          className="mb-6 bg-[#F5E6D3] border-3 border-[#2C1810] px-5 py-2 text-xl text-[#2C1810] shadow-md transform hover:scale-105 transition-transform active:scale-95"
          style={{ fontFamily: 'Patrick Hand, cursive', transform: 'rotate(-1deg)', boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)' }}>
          ← Back
        </button>

        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-6 shadow-lg mb-6"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
          
          <h1 className="text-5xl text-[#2C1810] tracking-wide transform -rotate-1 mb-6 text-center"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            Top Players
          </h1>

          {loading ? (
            <p className="text-center text-xl text-[#8B6F47] animate-pulse" style={{ fontFamily: 'Patrick Hand, cursive' }}>Loading ranks...</p>
          ) : (
            <div className="space-y-4">
              {leaders.map((player, index) => {
                const rankInfo = getRank(player.rating || 1000);
                return (
                  <div key={player.id} className="flex items-center gap-4 bg-[#F5E6D3] border-3 border-[#2C1810] p-3 transform hover:scale-105 transition-transform"
                       style={{ transform: index % 2 === 0 ? 'rotate(0.5deg)' : 'rotate(-0.5deg)', boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)' }}>
                    <div className="text-3xl text-[#D2691E] w-8 font-bold" style={{ fontFamily: 'Caveat, cursive' }}>
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl text-[#2C1810] font-bold" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                        {rankInfo.emoji} {player.username || 'Anonymous'}
                      </div>
                      <div className="text-sm text-[#8B6F47]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                        {rankInfo.title} • Lvl {player.level || 1}
                      </div>
                    </div>
                    <div className="text-2xl text-[#2C1810]" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                      {player.rating || 1000} <span className="text-sm">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
