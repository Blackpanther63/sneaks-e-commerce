import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Mail, Lock, User, Phone, ChevronRight, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';

type Step = 'form' | 'otp';

export const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'password'>('email');
  const [step, setStep] = useState<Step>('form');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'mobile'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Message passed when redirected (e.g. "Please login to checkout")
  const [redirectMessage] = useState<string>(location.state?.message || '');
  const [devPreviewUrl, setDevPreviewUrl] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const otp = otpDigits.join('');

  // ── OTP Input handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[idx] = val;
    setOtpDigits(newDigits);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtpDigits(text.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setError('');
    setLoading(true);
    setDevPreviewUrl('');
    setDevOtp('');
    try {
      // Send ALL signup data to be persisted on backend during OTP step
      const res = await api.post('/auth/send-otp', { 
        email, 
        phone, 
        method: verificationMethod,
        first_name: firstName,
        last_name: lastName,
        password
      });
      
      if (res.data.devPreviewUrl) setDevPreviewUrl(res.data.devPreviewUrl);
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      
      setStep('otp');
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password Handlers ────────────────────────────────────────────────
  const handleForgotPasswordOtp = async () => {
    setError('');
    setLoading(true);
    setDevPreviewUrl('');
    setDevOtp('');
    try {
      const res = await api.post('/auth/forgot-password-otp', { email });
      if (res.data.devPreviewUrl) setDevPreviewUrl(res.data.devPreviewUrl);
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      
      setForgotPasswordStep('otp');
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp,
        password
      });
      if (res.data.success) {
        alert(res.data.message || 'Password reset successful. Please login with your new password.');
        setIsForgotPassword(false);
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && step === 'form' && verificationMethod === 'mobile' && !phone) {
      setError('Please enter your phone number for mobile verification.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isForgotPassword) {
        if (forgotPasswordStep === 'email') {
          await handleForgotPasswordOtp();
        } else if (forgotPasswordStep === 'otp') {
          setForgotPasswordStep('password');
        } else if (forgotPasswordStep === 'password') {
          await handleResetPassword();
        }
      } else if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        // Handle new success/message format
        if (res.data.success || (res.data.token && res.data.id)) {
          login(res.data);
          navigate('/');
        } else {
          setError(res.data.message || 'Invalid login response.');
        }
      } else {
        if (step === 'form') {
          await sendOtp();
        } else {
          // Verify OTP + create account
          // Backend now retrieves user data from the session/otpStore
          const res = await api.post('/auth/register', {
            email,
            otp,
          });
          
          if (res.data.success) {
            // Success! The backend returns the user object inside 'user'
            if (res.data.user) {
              login(res.data.user);
            }
            alert(res.data.message || 'Account created successfully!');
            navigate('/');
          } else {
            setError(res.data.message || 'Registration failed.');
          }
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      console.error("[AUTH] Error:", msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 mb-3">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <h1 className="text-white font-black text-2xl tracking-tight">SNEAKS</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {isForgotPassword 
                ? (forgotPasswordStep === 'email' ? 'Reset Password' : forgotPasswordStep === 'otp' ? 'Verify your email' : 'Create new password')
                : isLogin ? 'Welcome back!' : step === 'otp' ? (verificationMethod === 'email' ? 'Verify your email' : 'Verify your mobile') : 'Create your account'}
            </p>
          </div>

          <div className="px-8 py-8">
            {/* Step indicator for signup */}
            {!isLogin && !isForgotPassword && (
              <div className="flex items-center gap-2 mb-6">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step === 'form' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>
                  {step === 'otp' ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <div className={`flex-1 h-0.5 ${step === 'otp' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step === 'otp' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <span className="text-xs text-gray-400 ml-1">{step === 'form' ? 'Your details' : (verificationMethod === 'email' ? 'Verify email' : 'Verify mobile')}</span>
              </div>
            )}

            {/* Step indicator for forgot password */}
            {isForgotPassword && (
              <div className="flex items-center gap-2 mb-6">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-indigo-600 text-white`}>
                  {forgotPasswordStep === 'otp' || forgotPasswordStep === 'password' ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <div className={`flex-1 h-0.5 ${forgotPasswordStep === 'otp' || forgotPasswordStep === 'password' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${forgotPasswordStep === 'otp' || forgotPasswordStep === 'password' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {forgotPasswordStep === 'password' ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <div className={`flex-1 h-0.5 ${forgotPasswordStep === 'password' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${forgotPasswordStep === 'password' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
              </div>
            )}

            {/* Verification Method toggle for Signup */}
            {!isLogin && !isForgotPassword && step === 'form' && (
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setVerificationMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${verificationMethod === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Mail className="h-3.5 w-3.5" /> Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationMethod('mobile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${verificationMethod === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Phone className="h-3.5 w-3.5" /> Mobile OTP
                </button>
              </div>
            )}

            {/* Redirect message (e.g. login required for checkout) */}
            {redirectMessage && !isForgotPassword && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                <span className="text-base">🔒</span>
                <span>{redirectMessage}</span>
              </div>
            )}

            {/* Error message */}
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

            {/* Dev preview URL / Simulated OTP */}
            {(devPreviewUrl || devOtp) && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                <strong>Dev mode:</strong> {devPreviewUrl ? 'No real SMTP set. ' : 'Simulated SMS. '}
                {devPreviewUrl && (
                  <a href={devPreviewUrl} target="_blank" rel="noreferrer" className="underline font-semibold">
                    Click here to see the OTP email ↗
                  </a>
                )}
                {devOtp && (
                  <span className="font-semibold block mt-1">Simulated OTP Code: {devOtp}</span>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ── FORGOT PASSWORD FLOW ──────────────────────────────────── */}
              {isForgotPassword && (
                <>
                  {forgotPasswordStep === 'email' && (
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="Enter your account email" />
                    </div>
                  )}

                  {forgotPasswordStep === 'otp' && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-6">
                        We sent a 6-digit reset code to <strong className="text-gray-900">{email}</strong>.<br />
                      </p>
                      <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            style={{ height: '52px' }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm mb-2">
                        {resendCountdown > 0 ? (
                          <span className="text-gray-400">Resend in <span className="font-semibold text-gray-600">{resendCountdown}s</span></span>
                        ) : (
                          <button type="button" onClick={handleForgotPasswordOtp} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                            <RefreshCw className="h-3.5 w-3.5" /> Resend code
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {forgotPasswordStep === 'password' && (
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="New Password" />
                      </div>
                      {/* Live password requirements */}
                      {password.length > 0 && (
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
                    </div>
                  )}
                  
                  <button type="button" onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(''); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2 mx-auto">
                    <ArrowLeft className="h-3 w-3" /> Back to login
                  </button>
                </>
              )}

              {/* ── LOGIN FORM ─────────────────────────────────────────────── */}
              {isLogin && !isForgotPassword && (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="Email address" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Password" />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setIsForgotPassword(true); setIsLogin(false); setError(''); }} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Forgot password?
                    </button>
                  </div>
                </>
              )}

              {/* ── SIGNUP STEP 1: FORM ─────────────────────────────────────── */}
              {!isLogin && !isForgotPassword && step === 'form' && (
                <>
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="Email address" />
                  </div>
                  <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      value={phone}
                      onChange={setPhone as any}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Password" />
                    </div>
                    {/* Live password requirements */}
                    {password.length > 0 && (
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
                  </div>
                </>
              )}

              {/* ── SIGNUP STEP 2: OTP ──────────────────────────────────────── */}
              {!isLogin && !isForgotPassword && step === 'otp' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-6">
                    We sent a 6-digit code to <strong className="text-gray-900">{verificationMethod === 'email' ? email : phone}</strong>.<br />
                    <span className="text-xs text-gray-400">
                      {verificationMethod === 'email' ? 'Check your spam folder if you don\'t see it.' : 'It may take a few seconds to arrive.'}
                    </span>
                  </p>

                  {/* OTP boxes */}
                  <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        style={{ height: '52px' }}
                      />
                    ))}
                  </div>

                  {/* Resend */}
                  <div className="flex items-center justify-center gap-2 text-sm mb-2">
                    {resendCountdown > 0 ? (
                      <span className="text-gray-400">Resend in <span className="font-semibold text-gray-600">{resendCountdown}s</span></span>
                    ) : (
                      <button type="button" onClick={sendOtp} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                        <RefreshCw className="h-3.5 w-3.5" /> Resend code
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => { setStep('form'); setError(''); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mx-auto mt-1">
                    <ArrowLeft className="h-3 w-3" /> Change details / {verificationMethod}
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || (!isLogin && !isForgotPassword && step === 'otp' && otp.length < 6) || (isForgotPassword && forgotPasswordStep === 'otp' && otp.length < 6)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 text-sm transition-all duration-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Please wait…</span>
                ) : (
                  <>
                    {isForgotPassword ? (
                      forgotPasswordStep === 'email' ? 'Send Reset Link' : forgotPasswordStep === 'otp' ? 'Verify Code' : 'Reset Password'
                    ) : isLogin ? 'Sign In' : step === 'form' ? 'Send Verification Code' : 'Verify & Create Account'}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Secondary button for switching between Login/Signup */}
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => { 
                    setIsLogin(!isLogin); 
                    setStep('form'); 
                    setError(''); 
                    setOtpDigits(['','','','','','']);
                    // Reset scroll to top of card when switching
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-100 bg-white hover:bg-indigo-50 text-indigo-600 font-bold py-3 text-sm transition-all duration-200"
                >
                  {isLogin ? "Create New Account" : "Back to Sign In"}
                </button>
              )}
            </form>

            {/* Toggle login/signup */}

          </div>
        </div>
      </motion.div>
    </div>
  );
};
