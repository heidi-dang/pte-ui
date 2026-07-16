/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  initialView?: 'login' | 'register';
  onClose: () => void;
}

export const Auth: React.FC<AuthProps> = ({ initialView = 'login', onClose }) => {
  const { theme, login, register } = useGlobalContext();
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'verify' | 'reset'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mockVerificationCode, setMockVerificationCode] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError('');
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      setError('All fields are mandatory.');
      return;
    }
    setError('');
    try {
      await register(username, email, password);
      setSuccessMsg('Your account was registered successfully! Redirecting...');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different email.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please specify your registered email.');
      return;
    }
    setError('');
    setSuccessMsg('A security code was transmitted to your inbox.');
    setTimeout(() => {
      setSuccessMsg('');
      setView('verify');
    }, 1500);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mockVerificationCode.length !== 4) {
      setError('Security code must be exactly 4 digits.');
      return;
    }
    setError('');
    setSuccessMsg('Email verified successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      setView('reset');
    }, 1500);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Your new password must contain at least 6 characters.');
      return;
    }
    setError('');
    setSuccessMsg('Password updated successfully! Redirecting...');
    setTimeout(() => {
      setSuccessMsg('');
      login(email || 'heidi.dang.dev@gmail.com');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-md rounded-2xl border p-8 relative shadow-2xl ${
          theme === 'dark' ? 'bg-[#101424] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-xs font-mono text-gray-500 hover:text-gray-300">
          ✕ ESC
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">PTE ACADEMIC MASTER</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            {view === 'login' && 'Sign In to Your Hub'}
            {view === 'register' && 'Create Your Study Account'}
            {view === 'forgot' && 'Account Recovery'}
            {view === 'verify' && 'Verify Your Identity'}
            {view === 'reset' && 'Establish New Password'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {view === 'login' && 'Enter your student credentials to resume learning.'}
            {view === 'register' && 'Access all 22 task simulators and study progress tools.'}
            {view === 'forgot' && 'Provide your email to secure a reset verification code.'}
            {view === 'verify' && 'A 4-digit code was sent to your email inbox.'}
            {view === 'reset' && 'Configure a secure, unique password for future logins.'}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Modules */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Mail className="w-4 h-4" /></span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="heidi.dang.dev@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400">Password</label>
                <button type="button" onClick={() => setView('forgot')} className="text-[10px] text-emerald-400 hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-4 border-t border-gray-800/40 text-xs">
              <span className="text-gray-400">New to PTE Master? </span>
              <button type="button" onClick={() => setView('register')} className="text-emerald-400 hover:underline font-semibold">
                Create Account
              </button>
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Your Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><User className="w-4 h-4" /></span>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Heidi Dang"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Mail className="w-4 h-4" /></span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="heidi@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              Register Account <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-4 border-t border-gray-800/40 text-xs">
              <span className="text-gray-400">Already a member? </span>
              <button type="button" onClick={() => setView('login')} className="text-emerald-400 hover:underline font-semibold">
                Sign In
              </button>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Mail className="w-4 h-4" /></span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="heidi.dang.dev@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              Request Recovery Code
            </button>

            <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-gray-400 hover:text-white pt-2 block">
              Back to Sign In
            </button>
          </form>
        )}

        {view === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 text-center mb-3">Verification Security Code</label>
              <input
                required
                maxLength={4}
                type="text"
                value={mockVerificationCode}
                onChange={(e) => setMockVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="4096"
                className={`w-32 mx-auto text-center px-4 py-3 rounded-lg text-xl tracking-[0.5em] font-extrabold border focus:outline-none focus:ring-1 block ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                }`}
              />
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              Confirm Security Code
            </button>

            <div className="text-center pt-2 text-[10px] text-gray-500">
              Didn\'t receive a code? <button type="button" onClick={() => alert('Code resent!')} className="text-emerald-400 hover:underline">Resend code</button>
            </div>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Choose New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Configure strong password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              Establish Password & Log In
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
