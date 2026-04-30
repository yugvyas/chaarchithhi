import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

const LobbyScreen = () => {
  const { socket } = useSocket();
  const { gameState, updateGameState, resetGame } = useGame();

  const [chithhiName, setChithhiName] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  const isHost = gameState.hostId === socket?.id;
  const me = gameState.players.find((p) => p.id === socket?.id);
  const myChithhiName = me?.chithhiName;
  const allNamesSet = gameState.players.length >= 2 && gameState.players.every((p) => p.chithhiName);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  useEffect(() => {
    if (!socket) return;

    // FIX #11: Named handler references
    const handlePlayerUpdated = (data) => {
      updateGameState({ players: data.players });
      setError('');
    };

    const handlePlayerJoined = (data) => {
      updateGameState({ players: data.players });
    };

    const handlePlayerLeft = (data) => {
      updateGameState({ players: data.players, hostId: data.hostId });
      showNotification(`${data.disconnectedName} left the room`);
    };

    const handleHostChanged = (data) => {
      updateGameState({ hostId: data.newHostId });
      if (data.newHostId === socket.id) {
        showNotification('You are now the host!');
      }
    };

    const handleGameStarted = (data) => {
      updateGameState({
        status: 'playing',
        turnOrder: data.turnOrder,
        currentTurn: data.currentTurn,
        maxPasses: data.maxPasses,
        roundsCurrent: data.roundsCurrent,
        roundsTotal: data.roundsTotal,
        hand: data.hand || [],
      });
    };

    const handleError = (err) => setError(err.message);

    const handleGameAborted = (data) => {
      showNotification(data.reason);
      setTimeout(() => updateGameState({ status: 'lobby' }), 2000);
    };

    const handleKicked = (data) => {
      alert(data.message);
      resetGame();
    };

    socket.on('player_updated', handlePlayerUpdated);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('host_changed', handleHostChanged);
    socket.on('game_started', handleGameStarted);
    socket.on('error', handleError);
    socket.on('game_aborted', handleGameAborted);

    return () => {
      socket.off('player_updated', handlePlayerUpdated);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('host_changed', handleHostChanged);
      socket.off('game_started', handleGameStarted);
      socket.off('error', handleError);
      socket.off('game_aborted', handleGameAborted);
      socket.off('kicked', handleKicked);
    };
  }, [socket, updateGameState]);

  const handleSetChithhi = (e) => {
    e.preventDefault();
    if (!chithhiName.trim()) return;
    socket.emit('set_chithhi_name', {
      roomCode: gameState.roomCode,
      chithhiName: chithhiName.trim(),
    });
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
    <div className="h-full w-full bg-[#8B6F47] relative overflow-hidden flex flex-col items-center justify-between p-6"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2C1810] text-[#FFF8E7] px-6 py-3 rounded text-xl font-bold shadow-lg border-2 border-[#D4A373] whitespace-nowrap"
            style={{ fontFamily: 'Caveat, cursive' }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Code Display */}
      <div className="w-full max-w-md shrink-0">
        <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-4 flex flex-col items-center justify-center transform -rotate-1 shadow-lg relative"
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
          <div className="text-lg text-[#8B6F47] mb-1 font-bold tracking-widest uppercase">
            Room Code
          </div>
          <div className="flex items-center gap-4">
            <div className="text-5xl text-[#2C1810] tracking-widest" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {gameState.roomCode}
            </div>
            <button
              onClick={copyRoomCode}
              className="p-2 bg-[#F5E6D3] border-2 border-[#2C1810] rounded hover:bg-[#D4A373] transition-colors"
            >
              {copied ? (
                <Check size={24} className="text-green-800" />
              ) : (
                <Copy size={24} className="text-[#2C1810]" />
              )}
            </button>
          </div>
          <div className="absolute -top-4 -right-4 bg-[#D2691E] text-[#FFF8E7] px-3 py-1 border-2 border-[#2C1810] font-bold transform rotate-6 shadow-md" style={{ fontFamily: 'Caveat, cursive', fontSize: '1.25rem' }}>
            {gameState.players.length} Players
          </div>
        </div>

        {/* Game Settings (Host Only) */}
        {isHost && (
          <div className="mt-4 bg-[#F5E6D3] border-4 border-[#2C1810] p-3 shadow-md transform rotate-1 flex flex-col gap-3 max-h-48 overflow-y-auto hide-scrollbar">
            <h3 className="text-[#2C1810] font-bold text-xl uppercase tracking-tight mb-1 text-center border-b-2 border-[#2C1810] pb-1" style={{ fontFamily: 'Caveat, cursive' }}>Host Controls</h3>
            
            {/* Rounds */}
            <div className="flex justify-between items-center">
              <span className="text-[#2C1810] font-bold text-sm">Rounds</span>
              <select 
                value={gameState.settings?.rounds || 3} 
                onChange={(e) => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { rounds: Number(e.target.value) }})}
                className="bg-[#FFF8E7] border-2 border-[#2C1810] text-sm font-bold px-1 outline-none"
              >
                <option value={3}>3 Rounds</option>
                <option value={5}>5 Rounds</option>
                <option value={7}>7 Rounds</option>
                <option value={10}>10 Rounds</option>
              </select>
            </div>

            {/* Passes Multiplier */}
            <div className="flex justify-between items-center">
              <span className="text-[#2C1810] font-bold text-sm">Passes per player</span>
              <select 
                value={gameState.settings?.maxPassesMultiplier ?? 10} 
                onChange={(e) => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { maxPassesMultiplier: Number(e.target.value) }})}
                className="bg-[#FFF8E7] border-2 border-[#2C1810] text-sm font-bold px-1 outline-none"
              >
                <option value={5}>5x</option>
                <option value={10}>10x</option>
                <option value={15}>15x</option>
                <option value={20}>20x</option>
              </select>
            </div>

            {/* Turn Time Limit */}
            <div className="flex justify-between items-center">
              <span className="text-[#2C1810] font-bold text-sm">Turn Time Limit</span>
              <select 
                value={gameState.settings?.turnTimeLimit ?? 20000} 
                onChange={(e) => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { turnTimeLimit: Number(e.target.value) }})}
                className="bg-[#FFF8E7] border-2 border-[#2C1810] text-sm font-bold px-1 outline-none"
              >
                <option value={5000}>5 sec</option>
                <option value={10000}>10 sec</option>
                <option value={15000}>15 sec</option>
                <option value={20000}>20 sec</option>
                <option value={0}>No Limit</option>
              </select>
            </div>

            <hr className="border-[#2C1810]" />

            {/* Strict Dhappa Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#2C1810] font-bold text-sm">Strict 4-Card Dhappa</span>
              <button
                onClick={() => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { strictDhappa: !gameState.settings?.strictDhappa } })}
                className={`w-10 h-5 rounded-full transition-colors relative border-2 border-[#2C1810] shrink-0 ${gameState.settings?.strictDhappa ? 'bg-[#D2691E]' : 'bg-[#8B6F47]/20'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${gameState.settings?.strictDhappa ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* False Dhappa Penalty Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#2C1810] font-bold text-sm">False Dhappa Penalty</span>
              <button
                onClick={() => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { falseDhappaPenalty: gameState.settings?.falseDhappaPenalty ?? true } })}
                className={`w-10 h-5 rounded-full transition-colors relative border-2 border-[#2C1810] shrink-0 ${gameState.settings?.falseDhappaPenalty !== false ? 'bg-[#D2691E]' : 'bg-[#8B6F47]/20'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${gameState.settings?.falseDhappaPenalty !== false ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Challenge System Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#2C1810] font-bold text-sm">Challenge System</span>
              <button
                onClick={() => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { challengeSystem: gameState.settings?.challengeSystem ?? true } })}
                className={`w-10 h-5 rounded-full transition-colors relative border-2 border-[#2C1810] shrink-0 ${gameState.settings?.challengeSystem !== false ? 'bg-[#D2691E]' : 'bg-[#8B6F47]/20'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${gameState.settings?.challengeSystem !== false ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Negative Scores Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#2C1810] font-bold text-sm">Allow Negative Scores</span>
              <button
                onClick={() => socket.emit('update_settings', { roomCode: gameState.roomCode, settings: { negativeScores: gameState.settings?.negativeScores ?? false } })}
                className={`w-10 h-5 rounded-full transition-colors relative border-2 border-[#2C1810] shrink-0 ${gameState.settings?.negativeScores ? 'bg-[#D2691E]' : 'bg-[#8B6F47]/20'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${gameState.settings?.negativeScores ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Players List */}
      <div className="w-full max-w-md flex-1 overflow-y-auto py-6 flex flex-col gap-3 hide-scrollbar">
        {gameState.players.map((player, index) => (
          <div
            key={player.id}
            className="bg-[#F5E6D3] border-4 border-[#2C1810] p-4 flex items-center justify-between shadow-md shrink-0"
            style={{
              transform: `rotate(${[-1, 1, -0.5, 0.5][index % 4]}deg)`,
              boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)'
            }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl text-[#2C1810]" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                {player.name}
              </span>
              {player.id === socket?.id && (
                <span className="text-sm bg-[#2C1810] text-[#FFF8E7] px-2 py-0.5 rounded font-bold">You</span>
              )}
              {player.id === gameState.hostId && (
                <span className="text-sm border-2 border-[#D2691E] text-[#D2691E] px-2 py-0.5 font-bold transform -rotate-3 bg-[#FFF8E7]">Host</span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {player.chithhiName ? (
                <div className="bg-[#E8F5E9] border-2 border-[#2E7D32] px-3 py-0.5 transform rotate-2">
                  <span className="text-sm text-[#2E7D32] font-bold">Ready</span>
                </div>
              ) : (
                <span className="text-sm text-[#8B6F47] italic font-bold">Choosing...</span>
              )}
              {isHost && player.id !== socket?.id && (
                <div className="flex gap-1 mt-1">
                  <button 
                    onClick={() => socket.emit('transfer_host', { roomCode: gameState.roomCode, newHostId: player.id })} 
                    className="bg-[#D2691E] border-2 border-[#2C1810] text-[#FFF8E7] px-1.5 py-0.5 text-[10px] font-bold transform hover:scale-105 active:scale-95"
                  >
                    Make Host
                  </button>
                  <button 
                    onClick={() => socket.emit('kick_player', { roomCode: gameState.roomCode, playerId: player.id })} 
                    className="bg-red-600 border-2 border-[#2C1810] text-white px-1.5 py-0.5 text-[10px] font-bold transform hover:scale-105 active:scale-95"
                  >
                    Kick
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {gameState.players.length < 2 && (
           <p className="mt-2 text-center text-xl text-[#FFF8E7] opacity-80" style={{ fontFamily: 'Caveat, cursive' }}>
             Need at least 2 players to start...
           </p>
        )}
      </div>

      {/* Action Area */}
      <div className="w-full max-w-md shrink-0">
        {!myChithhiName ? (
          <form onSubmit={handleSetChithhi} className="bg-[#FFF8E7] border-4 border-[#2C1810] p-5 shadow-lg transform rotate-1" style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>
            <label className="block text-2xl text-[#2C1810] mb-2" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              Write your Chithhi (Secret)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={chithhiName}
                onChange={(e) => setChithhiName(e.target.value)}
                placeholder="e.g. Batman, Pizza..."
                className="flex-1 bg-transparent border-b-2 border-[#2C1810] px-2 py-2 text-2xl text-[#2C1810] placeholder-[#8B6F47] outline-none"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}
              />
              <button
                type="submit"
                className="bg-[#2C1810] text-[#FFF8E7] py-2 px-6 text-xl font-bold border-2 border-[#D4A373] hover:bg-[#4A2E1B] transition-colors"
                style={{ fontFamily: 'Caveat, cursive' }}
              >
                Set
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-2 font-bold">{error}</p>}
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-[#FFF8E7] border-4 border-[#2C1810] p-4 text-center transform -rotate-1 shadow-md">
              <p className="text-lg text-[#8B6F47] mb-1 font-bold">Your Secret Chithhi</p>
              <p className="text-4xl text-[#D2691E]" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                "{myChithhiName}"
              </p>
            </div>

            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!allNamesSet}
                className="w-full bg-[#D2691E] border-4 border-[#2C1810] px-8 py-5 text-4xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontWeight: 700,
                  transform: 'rotate(-0.5deg)',
                  boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.4)',
                  animation: allNamesSet ? 'pulse 2s infinite' : 'none'
                }}>
                {allNamesSet ? 'Start Game!' : 'Waiting for everyone...'}
              </button>
            ) : (
              <div className="bg-[#F5E6D3] border-4 border-[#2C1810] px-8 py-5 text-center transform rotate-1 shadow-lg" style={{ boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)' }}>
                 <p className="text-3xl text-[#2C1810] animate-pulse" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                    Waiting for host to start...
                 </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: rotate(-0.5deg) scale(1); }
          50% { transform: rotate(-0.5deg) scale(1.05); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default LobbyScreen;
