import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { supabase } from '../supabase';
import { getRank } from '../ranks';

const LandingScreen = () => {
  const { socket, isConnected } = useSocket();
  const { updateGameState } = useGame();

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [error, setError] = useState('');
  const [userRank, setUserRank] = useState(null);

  // FIX #3 / #4: Use refs so socket handlers always read the latest values
  // without re-registering listeners on every keystroke
  const nameRef = useRef(name);
  const roomCodeRef = useRef(roomCode);
  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => {
    import('../supabase').then(({ supabase }) => {
      const fetchRank = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('rating, username')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setName(profile.username || user.user_metadata?.full_name || '');
          const points = profile.rating || 1000;
          const currentRank = getRank(points);
          setUserRank(`${currentRank.emoji} ${currentRank.title} • ${points.toLocaleString()} pts`);
        }
      };
      if (isConnected) fetchRank();
    });
  }, [isConnected]);

  useEffect(() => {
    if (!socket) return;

    // FIX #11: Named handler refs so socket.off() removes only this component's listeners
    const handleRoomCreated = (data) => {
      updateGameState({
        roomCode: data.roomCode,
        hostId: data.hostId,
        players: data.players,
        status: 'lobby',
        playerName: nameRef.current,
      });
    };

    // FIX #4: Listen for 'room_joined' (sent only to the joining player)
    // instead of 'player_joined' (broadcast to whole room)
    const handleRoomJoined = (data) => {
      updateGameState({
        roomCode: data.roomCode,
        hostId: data.hostId,
        players: data.players,
        status: 'lobby',
        playerName: nameRef.current,
      });
    };

    const handleError = (err) => {
      setError(err.message);
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('error', handleError);

    // FIX #11: Always pass the handler reference to socket.off()
    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('error', handleError);
    };
  }, [socket, updateGameState]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name'); return; }
    setError('');
    socket.emit('create_room', { playerName: name.trim() });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) {
      setError('Please enter name and room code');
      return;
    }
    setError('');
    socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName: name.trim() });
  };

  return (
    <div className="h-full w-full bg-[#8B6F47] relative overflow-hidden flex items-center justify-center p-6"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      {/* Top Buttons */}
      <div className="absolute top-6 left-6 z-30">
        <button
          onClick={() => updateGameState({ status: 'profile' })}
          className="bg-[#FFF8E7] border-3 border-[#2C1810] p-3 shadow-md transform -rotate-3 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
          style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)' }}
        >
          <span className="text-3xl leading-none">👤</span>
        </button>
      </div>

      <div className="absolute top-6 right-20 z-30">
        <button
          onClick={() => updateGameState({ status: 'leaderboard' })}
          className="bg-[#FFF8E7] border-3 border-[#2C1810] p-3 shadow-md transform rotate-3 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
          style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.3)' }}
        >
          <span className="text-3xl leading-none">🏆</span>
        </button>
      </div>

      <div className="max-w-md w-full flex flex-col items-center gap-12 relative z-10">
      
        {/* Title */}
        <div className="relative z-10">
          <h1 className="text-6xl text-[#2C1810] tracking-wide transform -rotate-1"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            Chaar Chithhi
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[#2C1810] opacity-20 transform rotate-1"></div>
        </div>

        {/* Action Container */}
        <div className="w-full flex flex-col gap-6 z-10">
          {!mode ? (
            <>
              <button
                onClick={() => { setMode('create'); setError(''); }}
                className="w-full relative bg-[#FFF8E7] border-4 border-[#2C1810] px-8 py-6 shadow-lg transform hover:scale-105 transition-transform active:scale-95"
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontWeight: 700,
                  transform: 'rotate(-1deg)',
                  boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
                }}>
                <span className="text-3xl text-[#2C1810]">Create Room</span>
              </button>

              <button
                onClick={() => { setMode('join'); setError(''); }}
                className="w-full relative bg-[#F5E6D3] border-4 border-[#2C1810] px-8 py-6 shadow-lg transform hover:scale-105 transition-transform active:scale-95"
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontWeight: 700,
                  transform: 'rotate(1deg)',
                  boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
                }}>
                <span className="text-3xl text-[#2C1810]">Join Room</span>
              </button>
            </>
          ) : (
            <form 
              onSubmit={mode === 'create' ? handleCreate : handleJoin} 
              className="relative bg-[#F5E6D3] border-4 border-[#2C1810] p-6 shadow-lg"
              style={{
                transform: 'rotate(1deg)',
                boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
              }}>
              
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="YOUR NAME"
                className="w-full bg-transparent border-b-2 border-[#2C1810] text-center text-3xl text-[#2C1810] placeholder-[#8B6F47] outline-none mb-6"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}
                autoFocus
              />

              {mode === 'join' && (
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  className="w-full bg-transparent border-b-2 border-[#2C1810] text-center text-3xl text-[#2C1810] placeholder-[#8B6F47] outline-none mb-6 uppercase tracking-widest"
                  style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}
                />
              )}

              {error && (
                <p className="text-red-800 bg-red-200/50 text-center font-bold mb-4 p-2 rounded" style={{ fontFamily: 'Caveat, cursive', fontSize: '1.25rem' }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode(null); setError(''); }}
                  className="flex-1 bg-[#D4A373] border-2 border-[#2C1810] py-3 text-xl text-[#2C1810] hover:bg-[#C49363]"
                  style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!isConnected}
                  className="flex-1 bg-[#D2691E] border-2 border-[#2C1810] py-3 text-xl text-[#FFF8E7] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B85A10]"
                  style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                  {mode === 'create' ? 'Create!' : 'Join!'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-4 border-[#2C1810] bg-[#FFF8E7] transform -rotate-12 opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-12 right-12 w-12 h-12 border-4 border-[#2C1810] bg-[#F5E6D3] transform rotate-45 opacity-30 pointer-events-none"></div>

      </div>

      {!isConnected ? (
        <div className="absolute bottom-4 text-[#2C1810] font-bold opacity-50 z-20 animate-pulse" style={{ fontFamily: 'Caveat, cursive', fontSize: '1.5rem' }}>
          Connecting to server...
        </div>
      ) : userRank ? (
        <div className="absolute bottom-6 bg-[#F5E6D3] border-3 border-[#2C1810] px-6 py-2 transform rotate-1 shadow-md z-20"
             style={{ boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)' }}>
          <span className="text-2xl text-[#2C1810]" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {userRank}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default LandingScreen;
