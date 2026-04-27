import { useState } from "react";
import { useNavigate } from "react-router";

export default function LandingScreen() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleCreateRoom = () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/lobby/${roomCode}`);
  };

  const handleJoinRoom = () => {
    if (joinCode.length === 6) {
      navigate(`/lobby/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="h-screen w-full bg-[#8B6F47] relative overflow-hidden flex items-center justify-center p-6"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      <div className="max-w-md w-full flex flex-col items-center gap-12">

        {/* Title */}
        <div className="relative">
          <h1 className="text-6xl text-[#2C1810] tracking-wide transform -rotate-1"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            Chaar Chithhi
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[#2C1810] opacity-20 transform rotate-1"></div>
        </div>

        {/* Buttons Container */}
        <div className="w-full flex flex-col gap-6">

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="relative bg-[#FFF8E7] border-4 border-[#2C1810] px-8 py-6 shadow-lg transform hover:scale-105 transition-transform active:scale-95"
            style={{
              fontFamily: 'Caveat, cursive',
              fontWeight: 700,
              transform: 'rotate(-1deg)',
              boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
            }}>
            <span className="text-3xl text-[#2C1810]">Create Room</span>
          </button>

          {/* Join Room Section */}
          {!isJoining ? (
            <button
              onClick={() => setIsJoining(true)}
              className="relative bg-[#F5E6D3] border-4 border-[#2C1810] px-8 py-6 shadow-lg transform hover:scale-105 transition-transform active:scale-95"
              style={{
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                transform: 'rotate(1deg)',
                boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
              }}>
              <span className="text-3xl text-[#2C1810]">Join Room</span>
            </button>
          ) : (
            <div className="relative bg-[#F5E6D3] border-4 border-[#2C1810] p-6 shadow-lg"
                 style={{
                   transform: 'rotate(1deg)',
                   boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
                 }}>
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full bg-transparent border-b-2 border-[#2C1810] text-center text-3xl text-[#2C1810] placeholder-[#8B6F47] outline-none mb-4"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsJoining(false)}
                  className="flex-1 bg-[#D4A373] border-2 border-[#2C1810] py-3 text-xl text-[#2C1810] hover:bg-[#C49363]"
                  style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 6}
                  className="flex-1 bg-[#D2691E] border-2 border-[#2C1810] py-3 text-xl text-[#FFF8E7] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B85A10]"
                  style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
                  Join!
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-4 border-[#2C1810] bg-[#FFF8E7] transform -rotate-12 opacity-30"></div>
        <div className="absolute bottom-12 right-12 w-12 h-12 border-4 border-[#2C1810] bg-[#F5E6D3] transform rotate-45 opacity-30"></div>
      </div>
    </div>
  );
}
