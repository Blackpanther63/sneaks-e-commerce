import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectMessage] = useState<string>(location.state?.message || '');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Email/Password Login
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success && res.data.token) {
          login(res.data.token, res.data.user);
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          throw new Error(res.data.message || 'Login failed');
        }
      } else {
        // Registration Flow
        const name = `${firstName} ${lastName}`.trim();
        const res = await api.post('/auth/register', { email, password, name });
        if (res.data.success && res.data.token) {
          login(res.data.token, res.data.user);
          navigate('/');
        } else {
          throw new Error(res.data.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      console.error('[AUTH] Error:', err);
      let errMsg = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all';

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 mb-3">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <h1 className="text-white font-black text-2xl tracking-tight">SNEAKS</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>

          <div className="px-8 py-8">
            {redirectMessage && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                <span className="text-base">🔒</span>
                <span>{redirectMessage}</span>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} placeholder="First name" />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} placeholder="Last name" />
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="Email address" />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Password" />
              </div>

              {!isLogin && password.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[
                    { label: '8+ chars', ok: password.length >= 8 },
                    { label: '1 number', ok: /\d/.test(password) },
                    { label: '1 symbol', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
                  ].map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${ok ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <span>{ok ? '✓' : '○'}</span>
                      {label}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 text-sm transition-all duration-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Please wait…</span>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { 
                  setIsLogin(!isLogin); 
                  setError(''); 
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-100 bg-white hover:bg-indigo-50 text-indigo-600 font-bold py-3 text-sm transition-all duration-200"
              >
                {isLogin ? "Create New Account" : "Back to Sign In"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
