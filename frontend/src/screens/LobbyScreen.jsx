import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, User } from 'lucide-react';

const LobbyScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState } = useGame();
  
  const [chithhiName, setChithhiName] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const isHost = gameState.hostId === socket.id;
  const me = gameState.players.find(p => p.id === socket.id);
  const myChithhiName = me?.chithhiName;
  
  const allNamesSet = gameState.players.every(p => p.chithhiName);

  useEffect(() => {
    if (!socket) return;

    socket.on('player_updated', (data) => {
      updateGameState({ players: data.players });
      setError('');
    });

    socket.on('player_joined', (data) => {
        updateGameState({ players: data.players });
    });

    socket.on('game_started', (data) => {
      updateGameState({
        status: data.currentTurn === socket.id ? 'cover' : 'playing', // Only active player goes to cover
        turnOrder: data.turnOrder,
        currentTurn: data.currentTurn,
        maxPasses: data.maxPasses,
        hand: data.hand || []
      });
    });

    socket.on('error', (err) => {
      setError(err.message);
    });

    return () => {
      socket.off('player_updated');
      socket.off('player_joined');
      socket.off('game_started');
      socket.off('error');
    };
  }, [socket, updateGameState]);

  const handleSetChithhi = (e) => {
    e.preventDefault();
    if (!chithhiName.trim()) return;
    socket.emit('set_chithhi_name', { roomCode: gameState.roomCode, chithhiName: chithhiName.trim() });
  };

  const handleStartGame = () => {
    socket.emit('start_game', { roomCode: gameState.roomCode });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-6 relative overflow-x-hidden overflow-y-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h2 className="text-xl font-body font-semibold text-ink-light uppercase tracking-wider text-sm">Room Code</h2>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-mono font-bold text-ink">{gameState.roomCode}</span>
            <button 
              onClick={copyRoomCode}
              className="p-2 hover:bg-ink/5 rounded-full transition-colors"
            >
              {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-ink-light" />}
            </button>
          </div>
        </div>
        <div className="bg-paper-dark px-4 py-2 rounded-full border border-ink/10 shadow-sm">
           <span className="font-semibold">{gameState.players.length}</span> <span className="text-sm text-ink-light">Players</span>
        </div>
      </header>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto mb-8">
        <h3 className="font-handwritten text-2xl font-bold mb-4 ml-2">Players</h3>
        <div className="space-y-3">
          <AnimatePresence>
            {gameState.players.map((player) => (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-paper-light p-4 rounded-2xl border border-ink/10 shadow-depth flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-paper font-bold ${player.id === gameState.hostId ? 'bg-accent-goldDark shadow-gold-glow' : 'bg-ink'}`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold font-serif text-lg flex items-center gap-2">
                      {player.name} {player.id === socket.id && <span className="text-xs font-sans bg-ink/10 px-2 py-0.5 rounded-full">You</span>}
                    </p>
                    {player.id === gameState.hostId && <p className="text-xs text-ink-light">Host</p>}
                  </div>
                </div>
                
                <div className="text-right">
                  {player.chithhiName ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                      <Check size={14} /> Ready
                    </span>
                  ) : (
                    <span className="text-sm text-ink-light italic">Choosing...</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-paper-light p-6 md:p-8 rounded-t-3xl border-t border-ink/10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] -mx-6 px-6 pb-12 mt-auto">
        {!myChithhiName ? (
          <form onSubmit={handleSetChithhi} className="flex flex-col gap-3">
             <label className="font-handwritten text-3xl font-bold">Write your Chithhi</label>
             <p className="text-sm text-ink-light mb-2 leading-relaxed">Pick a name (character, object, place) that others will try to collect.</p>
             <div className="flex flex-col sm:flex-row gap-3">
               <input 
                 type="text" 
                 value={chithhiName}
                 onChange={(e) => setChithhiName(e.target.value)}
                 className="flex-1 w-full bg-white border-2 border-ink/20 rounded-xl px-4 py-4 font-handwritten text-2xl focus:outline-none focus:border-[#D4AF37] transition-colors"
                 placeholder="e.g. Batman, Pizza..."
               />
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 type="submit"
                 className="bg-ink text-[#F3E5AB] py-4 sm:px-8 rounded-xl font-bold font-serif tracking-wider shadow-depth transition-transform w-full sm:w-auto"
               >
                 Set Name
               </motion.button>
             </div>
             {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </form>
        ) : (
          <div className="text-center py-2">
             <div className="inline-block transform rotate-[-2deg] bg-white px-8 py-4 rounded-xl shadow-paper border border-ink/10 mb-8 mt-4">
                <p className="font-handwritten text-4xl text-ink font-bold">"{myChithhiName}"</p>
             </div>
             
             {isHost ? (
               <motion.button
                 whileHover={allNamesSet ? { scale: 1.02 } : {}}
                 whileTap={allNamesSet ? { scale: 0.95 } : {}}
                 onClick={handleStartGame}
                 disabled={!allNamesSet}
                 className={`w-full py-5 rounded-2xl font-bold font-serif tracking-wider text-xl transition-all ${
                   allNamesSet 
                     ? 'bg-ink text-[#D4AF37] shadow-card-lifted' 
                     : 'bg-ink/10 text-ink/40 cursor-not-allowed shadow-none border border-ink/10'
                 }`}
               >
                 {allNamesSet ? 'Start Game' : 'Waiting for everyone...'}
               </motion.button>
             ) : (
               <p className="text-ink-light font-medium mt-2 animate-pulse">Waiting for host to start...</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;
