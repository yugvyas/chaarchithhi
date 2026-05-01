import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function AuthScreen({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onLogin(session.access_token, session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        onLogin(session.access_token, session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg("Passwords don't match!");
        setAuthLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.username || formData.email.split('@')[0],
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user && !data.session) {
        setSuccessMsg('Account created! Please check your email for the confirmation link.');
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setErrorMsg(error.message);
      }
    }
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#8B6F47] relative overflow-hidden flex items-center justify-center"
           style={{
             backgroundImage: `
               radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
               repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
               repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
             `,
             backgroundBlendMode: 'multiply'
           }}>
        <p className="text-[#FFF8E7] animate-pulse text-3xl font-bold" style={{ fontFamily: 'Caveat, cursive' }}>
          Checking your chithhis...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#8B6F47] relative overflow-hidden flex items-center justify-center p-6 py-12"
         style={{
           backgroundImage: `
             radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.8) 0%, transparent 50%),
             radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.6) 0%, transparent 50%),
             repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px),
             repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.03) 41px)
           `,
           backgroundBlendMode: 'multiply'
         }}>

      <div className="max-w-md w-full z-10 relative">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className={`text-5xl text-[#2C1810] tracking-wide transform ${isSignUp ? 'rotate-1' : '-rotate-1'} mb-2`}
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
            {isSignUp ? 'Join the Game!' : 'Welcome Back!'}
          </h1>
          <p className="text-xl text-[#FFF8E7]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            {isSignUp ? 'Create your account to start playing' : 'Sign in to play Chaar Chithhi'}
          </p>
        </div>

        {/* Form Card */}
        <div className={`bg-[#FFF8E7] border-4 border-[#2C1810] p-8 transform ${isSignUp ? 'rotate-0.5' : '-rotate-0.5'} shadow-lg mb-6`}
             style={{ boxShadow: '8px 8px 0px rgba(44, 24, 16, 0.3)' }}>

          {errorMsg && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-2 mb-4 transform -rotate-1 text-center"
                 style={{ fontFamily: 'Patrick Hand, cursive' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-100 border-2 border-green-500 text-green-700 px-4 py-2 mb-4 transform rotate-1 text-center"
                 style={{ fontFamily: 'Patrick Hand, cursive' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className={isSignUp ? "space-y-5" : "space-y-6"}>
            {/* Username Field (Only for Sign Up) */}
            {isSignUp && (
              <div>
                <label className="block text-xl text-[#2C1810] mb-2"
                       style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Choose a cool name"
                  className="w-full bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-3 text-xl text-[#2C1810] placeholder-[#8B6F47] transform -rotate-0.5"
                  style={{
                    fontFamily: 'Patrick Hand, cursive',
                    boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)'
                  }}
                  required={isSignUp}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xl text-[#2C1810] mb-2"
                     style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your@email.com"
                className="w-full bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-3 text-xl text-[#2C1810] placeholder-[#8B6F47] transform rotate-0.5"
                style={{
                  fontFamily: 'Patrick Hand, cursive',
                  boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)'
                }}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xl text-[#2C1810] mb-2"
                     style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-3 text-xl text-[#2C1810] placeholder-[#8B6F47] transform -rotate-0.5"
                style={{
                  fontFamily: 'Patrick Hand, cursive',
                  boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)'
                }}
                required
              />
            </div>

            {/* Confirm Password Field (Only for Sign Up) */}
            {isSignUp && (
              <div>
                <label className="block text-xl text-[#2C1810] mb-2"
                       style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-[#F5E6D3] border-3 border-[#2C1810] px-4 py-3 text-xl text-[#2C1810] placeholder-[#8B6F47] transform rotate-0.5"
                  style={{
                    fontFamily: 'Patrick Hand, cursive',
                    boxShadow: '3px 3px 0px rgba(44, 24, 16, 0.2)'
                  }}
                  required={isSignUp}
                />
              </div>
            )}

            {/* Forgot Password Link (Only for Sign In) */}
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => alert("Forgot password functionality coming soon!")}
                  className="text-lg text-[#D2691E] underline hover:text-[#B85A10]"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}>
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={authLoading || (isSignUp && formData.password !== formData.confirmPassword)}
              className="w-full bg-[#D2691E] border-4 border-[#2C1810] px-8 py-5 text-3xl text-[#FFF8E7] shadow-lg transform hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                transform: 'rotate(-0.5deg)',
                boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.4)'
              }}>
              {authLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#2C1810]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FFF8E7] px-4 text-lg text-[#8B6F47]"
                    style={{ fontFamily: 'Patrick Hand, cursive' }}>
                or
              </span>
            </div>
          </div>

          {/* Sign in with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full bg-white border-4 border-[#2C1810] px-6 py-4 flex items-center justify-center gap-3 shadow-lg transform hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
            style={{
              transform: 'rotate(0.5deg)',
              boxShadow: '6px 6px 0px rgba(44, 24, 16, 0.3)'
            }}>
            <svg viewBox="0 0 24 24" className="w-8 h-8">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-2xl text-[#2C1810]"
                  style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </span>
          </button>
        </div>

        {/* Toggle Sign Up / Sign In */}
        <div className="text-center">
          <p className="text-xl text-[#FFF8E7]" style={{ fontFamily: 'Patrick Hand, cursive' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-[#FFD93D] underline hover:text-[#FFC700]"
              style={{ fontFamily: 'Caveat, cursive', fontWeight: 700 }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Decorative paper elements */}
        {isSignUp ? (
          <>
            <div className="absolute top-16 left-8 w-20 h-16 bg-[#FFF8E7] border-3 border-[#2C1810] transform -rotate-12 opacity-30 pointer-events-none"
                 style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)' }}></div>
            <div className="absolute bottom-32 right-16 w-14 h-18 bg-[#F5E6D3] border-3 border-[#2C1810] transform rotate-25 opacity-30 pointer-events-none"
                 style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)' }}></div>
            <div className="absolute top-1/2 left-6 w-12 h-14 bg-[#FFF8E7] border-3 border-[#2C1810] transform rotate-45 opacity-20 pointer-events-none"
                 style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)' }}></div>
          </>
        ) : (
          <>
            <div className="absolute top-12 right-12 w-16 h-20 bg-[#FFF8E7] border-3 border-[#2C1810] transform rotate-12 opacity-30 pointer-events-none"
                 style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)' }}></div>
            <div className="absolute bottom-20 left-10 w-12 h-16 bg-[#F5E6D3] border-3 border-[#2C1810] transform -rotate-20 opacity-30 pointer-events-none"
                 style={{ boxShadow: '4px 4px 0px rgba(44, 24, 16, 0.2)' }}></div>
          </>
        )}
      </div>
    </div>
  );
}
