import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    roomCode: null,
    playerName: '',
    playerId: null, // this will be socket.id eventually but we can't reliably know it before connection
    hostId: null,
    players: [],
    status: 'landing', // landing, lobby, cover, playing, slappad, summary, results
    turnOrder: [],
    currentTurn: null,
    hand: [],
    maxPasses: 0,
    passCount: 0,
    scores: {},
    slapOrder: [],
    stalemate: false,
    dhappaBy: null
  });

  const updateGameState = (updates) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  return (
    <GameContext.Provider value={{ gameState, updateGameState }}>
      {children}
    </GameContext.Provider>
  );
};
