import { useState, useEffect } from "react";
import { useGame } from '../context/GameContext';
import { supabase } from '../supabase';
import { getRank, RANKS } from '../ranks';

export default function ProfileScreen() {
  const { updateGameState } = useGame();

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      const { data: stats } = await supabase
        .from('game_players')
        .select('total_score, final_rank, total_dhappas, false_dhappas, successful_challenges, fastest_slap_ms')
        .eq('user_id', user.id);
        
      let gamesPlayed = 0;
      let gamesWon = 0;
      let fastestDhappaMs = Infinity;
      
      if (stats) {
        gamesPlayed = stats.length;
        gamesWon = stats.filter(s => s.final_rank === 1).length;
        stats.forEach(s => {
          if (s.fastest_slap_ms && s.fastest_slap_ms < fastestDhappaMs) {
            fastestDhappaMs = s.fastest_slap_ms;
          }
        });
      }

      const joinedDate = new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      setUserData({
        username: profile?.username || user.user_metadata?.full_name || 'Player',
        email: user.email,
        totalPoints: profile?.rating || 1000,
        gamesPlayed,
        gamesWon,
        winRate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0,
        fastestDhappa: fastestDhappaMs === Infinity ? '--' : (fastestDhappaMs / 1000).toFixed(2),
        joinedDate
      });
    };
    
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!userData) {
    return (
      <div className="h-full w-full bg-[#8B6F47] flex items-center justify-center p-6"
           style={{
             backgroundImage: `
               radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%)
             `,
             backgroundBlendMode: 'multiply'
           }}>
        <p className="text-[#FFF8E7] animate-pulse text-3xl font-bold" style={{ fontFamily: 'Caveat, cursive' }}>
          Loading Profile...
        </p>
      </div>
    );
  }

  const currentRank = getRank(userData.totalPoints);

  const nextRank = RANKS.find(rank => rank.min > userData.totalPoints);
  const progressToNext = nextRank
    ? ((userData.totalPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

  return (
    <div className="h-full w-full bg-[#8B6F47] relative overflow-y-auto p-6 py-12"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => updateGameState({ status: 'landing' })}
          className="mb-6 bg-[#F5E6D3] border-3 border-[#2C1810] px-5 py-2 text-xl text-[#2C1810] shadow-md transform hover:scale-105 transition-transform active:scale-95"
          style={{
            fontFamily: 'Patrick Hand, cursive',
            transform: 'rotate(-1deg)',
            boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)'
          }}>
          ← Back
        </button>

        {/* Profile Card */}
        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-8 transform -rotate-0.5 shadow-lg mb-6"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>

          {/* Avatar & Name */}
          <div className="flex flex-col items-center mb-6">
            {/* Avatar - Paper cutout style */}
            <div className="relative mb-4">
              <div className="w-32 h-32 bg-[#D4A373] border-4 border-[#2C1810] rounded-full flex items-center justify-center transform rotate-3 shadow-lg"
                   style={{ boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)' }}>
                <span className="text-6xl">🎴</span>
              </div>
              {/* Rank badge on avatar */}
              <div className="absolute -bottom-2 -right-2 bg-[#FFD93D] border-3 border-[#2C1810] px-3 py-1 transform -rotate-12"
                   style={{ boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.3)' }}>
                <span className="text-2xl">{currentRank?.emoji}</span>
              </div>
            </div>

            <h1 className="text-4xl text-[#2C1810] mb-2"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {userData.username}
            </h1>
            <p className="text-lg text-[#8B6F47]"
               style={{ fontFamily: 'Patrick Hand, cursive' }}>
              {userData.email}
            </p>
          </div>

          {/* Rank Section */}
          <div className="bg-[#F5E6D3] border-3 border-[#2C1810] p-5 mb-6 transform rotate-0.5"
               style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)' }}>
            <div className="text-center mb-3">
              <div className="text-lg text-[#8B6F47] mb-1"
                   style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Current Rank
              </div>
              <div className="text-3xl text-[#D2691E] flex items-center justify-center gap-2"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                <span>{currentRank?.emoji}</span>
                <span>{currentRank?.title}</span>
              </div>
            </div>

            {/* Points Display */}
            <div className="text-center mb-3">
              <div className="text-4xl text-[#2C1810]"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {userData.totalPoints.toLocaleString()} pts
              </div>
            </div>

            {/* Progress to next rank */}
            {nextRank && (
              <div>
                <div className="flex justify-between text-sm text-[#8B6F47] mb-2"
                     style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  <span>Next: {nextRank.title}</span>
                  <span>{nextRank.min - userData.totalPoints} pts needed</span>
                </div>
                <div className="w-full h-3 bg-[#D4A373] border-2 border-[#2C1810] relative overflow-hidden">
                  <div
                    className="h-full bg-[#D2691E]"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#FFF8E7] border-3 border-[#2C1810] p-4 text-center transform -rotate-1"
                 style={{ boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)' }}>
              <div className="text-3xl text-[#2C1810] mb-1"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {userData.gamesPlayed}
              </div>
              <div className="text-sm text-[#8B6F47]"
                   style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Games Played
              </div>
            </div>

            <div className="bg-[#FFF8E7] border-3 border-[#2C1810] p-4 text-center transform rotate-1"
                 style={{ boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)' }}>
              <div className="text-3xl text-[#2C1810] mb-1"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {userData.gamesWon}
              </div>
              <div className="text-sm text-[#8B6F47]"
                   style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Games Won
              </div>
            </div>

            <div className="bg-[#FFF8E7] border-3 border-[#2C1810] p-4 text-center transform rotate-1"
                 style={{ boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)' }}>
              <div className="text-3xl text-[#2C1810] mb-1"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {userData.winRate}%
              </div>
              <div className="text-sm text-[#8B6F47]"
                   style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Win Rate
              </div>
            </div>

            <div className="bg-[#FFF8E7] border-3 border-[#2C1810] p-4 text-center transform -rotate-1"
                 style={{ boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)' }}>
              <div className="text-3xl text-[#2C1810] mb-1"
                   style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {userData.fastestDhappa}s
              </div>
              <div className="text-sm text-[#8B6F47]"
                   style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Fastest Dhappa
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="text-center text-lg text-[#8B6F47] mb-6"
               style={{ fontFamily: 'Patrick Hand, cursive' }}>
            Member since {userData.joinedDate}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full bg-[#FFF8E7] border-3 border-[#2C1810] px-6 py-3 text-xl text-[#D2691E] shadow-lg transform hover:scale-105 transition-transform active:scale-95"
              style={{
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                transform: 'rotate(0.5deg)',
                boxShadow: '5px 5px 0px rgba(44, 24, 16, 0.3)'
              }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
