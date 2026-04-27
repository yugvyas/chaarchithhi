import { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    roomCode: null,
    playerName: '',
    hostId: null,
    players: [],
    status: 'landing', // landing | lobby | cover | playing | slappad | summary | results
    turnOrder: [],
    currentTurn: null,
    hand: [],
    maxPasses: 0,
    passCount: 0,
    scores: {},
    slapOrder: [],
    stalemate: false,
    dhappaBy: null,
    isGameOver: false,
    roundsCurrent: 0,
    roundsTotal: 3,
  });

  // FIX #3: Support both plain-object and functional-updater forms
  // so socket handlers can always use the freshest state via `prev =>`
  const updateGameState = (updates) => {
    setGameState((prev) => ({
      ...prev,
      ...(typeof updates === 'function' ? updates(prev) : updates),
    }));
  };

  const resetGame = () => {
    setGameState((prev) => ({
      ...prev,
      status: 'landing',
      roomCode: null,
      playerName: '',
      hostId: null,
      players: [],
      turnOrder: [],
      currentTurn: null,
      hand: [],
      maxPasses: 0,
      passCount: 0,
      scores: {},
      slapOrder: [],
      stalemate: false,
      dhappaBy: null,
      isGameOver: false,
      roundsCurrent: 0,
      roundsTotal: 3,
    }));
  };

  return (
    <GameContext.Provider value={{ gameState, updateGameState, resetGame }}>
      {children}
    </GameContext.Provider>
  );
};
