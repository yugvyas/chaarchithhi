
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';

import LandingScreen from './screens/LandingScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import SlapPadScreen from './screens/SlapPadScreen';
import SummaryScreen from './screens/SummaryScreen';
import ResultsScreen from './screens/ResultsScreen';
import ProfileScreen from './screens/ProfileScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import AuthScreen from './screens/AuthScreen';

import bgMusicFile from './prettyjohn1-background-music-505061.mp3';

const DisconnectOverlay = () => {
  const { isConnected } = useSocket();
  const { gameState } = useGame();
  
  if (isConnected || gameState.status === 'landing') return null;
  
  return (
    <div className="absolute inset-0 z-[999] bg-[#2C1810]/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
      <div className="animate-pulse flex flex-col items-center">
        <h2 className="text-5xl text-[#D2691E] font-bold mb-4" style={{ fontFamily: 'Caveat, cursive' }}>Connection Lost!</h2>
        <p className="text-[#FFF8E7] text-xl mb-6">Trying to reconnect to the server...</p>
        <div className="w-12 h-12 border-4 border-[#D2691E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

const AppRouter = () => {
  const { gameState } = useGame();

  return (
    <>
      <DisconnectOverlay />
      {(() => {
        switch (gameState.status) {
          case 'lobby': return <LobbyScreen />;
          case 'playing': return <GameScreen />;
          case 'slappad': return <SlapPadScreen />;
          case 'summary': return <SummaryScreen />;
          case 'results': return <ResultsScreen />;
          case 'profile': return <ProfileScreen />;
          case 'leaderboard': return <LeaderboardScreen />;
          case 'landing':
          default:
            return <LandingScreen />;
        }
      })()}
    </>
  );
};

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }
  }, []);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log("Audio play failed", err));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <audio ref={audioRef} src={bgMusicFile} loop />
      <button 
        onClick={toggleMusic}
        className="absolute top-4 right-4 z-[100] p-2 bg-paper/80 backdrop-blur rounded-full shadow-md border-2 border-ink/20 text-ink hover:bg-paper transition-all"
        aria-label="Toggle Background Music"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </>
  );
};

const App = () => {
  const [session, setSession] = useState(null);

  return (
    <div className="min-h-[100dvh] bg-ink/5 sm:bg-ink/10 flex items-center justify-center sm:p-4">
      <div className="w-full sm:w-[430px] h-[100dvh] sm:h-[932px] sm:max-h-[95vh] bg-paper sm:rounded-[3rem] sm:shadow-2xl sm:border-[12px] sm:border-[#2C1810] overflow-hidden relative flex flex-col">
        <BackgroundMusic />
        {!session ? (
          <AuthScreen onLogin={(token, user) => setSession({ token, user })} />
        ) : (
          <SocketProvider token={session.token}>
            <GameProvider>
              <AppRouter />
            </GameProvider>
          </SocketProvider>
        )}
      </div>
    </div>
  );
};

export default App;
