import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';

// Screens (we'll create these next)
import LandingScreen from './screens/LandingScreen';
import LobbyScreen from './screens/LobbyScreen';
import CoverScreen from './screens/CoverScreen';
import GameScreen from './screens/GameScreen';
import SlapPadScreen from './screens/SlapPadScreen';
import SummaryScreen from './screens/SummaryScreen';

const AppRouter = () => {
  const { gameState } = useGame();

  // Simple router based on state
  switch (gameState.status) {
    case 'lobby': return <LobbyScreen />;
    case 'cover': return <CoverScreen />;
    case 'playing': return <GameScreen />;
    case 'slappad': return <SlapPadScreen />;
    case 'summary': return <SummaryScreen />;
    case 'results': return <div>Final Results Screen</div>;
    case 'landing':
    default:
      return <LandingScreen />;
  }
};

const App = () => {
  return (
    <div className="min-h-[100dvh] bg-ink/5 sm:bg-ink/10 flex items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-[400px] h-[100dvh] sm:h-[850px] sm:max-h-[90vh] bg-paper sm:rounded-[2.5rem] sm:shadow-2xl sm:border-[8px] sm:border-ink/90 overflow-hidden relative flex flex-col">
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
