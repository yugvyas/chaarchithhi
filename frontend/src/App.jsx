
import { SocketProvider } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';

import LandingScreen from './screens/LandingScreen';
import LobbyScreen from './screens/LobbyScreen';
import CoverScreen from './screens/CoverScreen';
import GameScreen from './screens/GameScreen';
import SlapPadScreen from './screens/SlapPadScreen';
import SummaryScreen from './screens/SummaryScreen';
import ResultsScreen from './screens/ResultsScreen'; // FIX #16

const AppRouter = () => {
  const { gameState } = useGame();

  switch (gameState.status) {
    case 'lobby': return <LobbyScreen />;
    case 'cover': return <CoverScreen />;
    case 'playing': return <GameScreen />;
    case 'slappad': return <SlapPadScreen />;
    case 'summary': return <SummaryScreen />;
    case 'results': return <ResultsScreen />; // FIX #16: proper results screen
    case 'landing':
    default:
      return <LandingScreen />;
  }
};

const App = () => {
  return (
    <div className="min-h-[100dvh] bg-ink/5 sm:bg-ink/10 flex items-center justify-center sm:p-4">
      <div className="w-full sm:w-[430px] h-[100dvh] sm:h-[932px] sm:max-h-[95vh] bg-paper sm:rounded-[3rem] sm:shadow-2xl sm:border-[12px] sm:border-[#2C1810] overflow-hidden relative flex flex-col">
        <SocketProvider>
          <GameProvider>
            <AppRouter />
          </GameProvider>
        </SocketProvider>
      </div>
    </div>
  );
};

export default App;
