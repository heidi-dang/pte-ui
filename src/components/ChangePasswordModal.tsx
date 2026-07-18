import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Check, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useGlobalContext } from './ThemeContext';
import { changePasswordRequest } from '../api/auth.api';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { theme } = useGlobalContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setSuccessMsg('Password changed successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
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
        <button onClick={onClose} className="absolute top-4 right-4 text-xs font-mono text-gray-500 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">PTE ACADEMIC MASTER</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Change Password</h2>
          <p className="text-xs text-gray-400 mt-1">Update your account password.</p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Current Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
              <input
                required
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                }`}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
              <input
                required
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                }`}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="w-4 h-4" /></span>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                }`}
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
            {isSubmitting ? 'Updating...' : 'Update Password'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
