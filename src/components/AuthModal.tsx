import React, { useState } from 'react';
import { X, User, ShieldCheck, Sparkles, AlertCircle, LogIn, KeyRound, Check, Zap } from 'lucide-react';
import { loginWithGoogle, loginWithUsername, loginAsGuest } from '../lib/firebase';
import { UserAuth } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAuth | null) => void;
}

const PRESET_ROLES = [
  { name: 'Panitia Lomba', icon: '🎯' },
  { name: 'Dewan Juri', icon: '⚖️' },
  { name: 'Admin Turnamen', icon: '👑' },
  { name: 'Operator Undian', icon: '🎲' },
  { name: 'Official Acara', icon: '🎪' }
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();
    if (!cleanName) {
      setErrorMsg('Harap masukkan nama panitia atau nama pengguna.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginWithUsername(cleanName, pin.trim());
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantGuestLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginAsGuest('Panitia Tamu');
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk instan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-900">
            <User className="h-6 w-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold mb-1.5 border border-emerald-200 dark:border-emerald-800">
            <Check className="h-3 w-3" />
            <span>Login Tanpa Email Aktif</span>
          </div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Masuk Sesi Panitia & Juri
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Cukup masukkan nama Anda untuk menyimpan data turnamen, bagan, dan skor lomba ke cloud.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Login Tanpa Email */}
        <form onSubmit={handleUsernameLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
              Nama Panitia / Juri / Pengguna
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="auth-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: Panitia Utama, Juri A, atau Nama Anda"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Quick Role Suggestions */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold mr-1">Pilihan Cepat:</span>
              {PRESET_ROLES.map((role) => (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => setUsername(role.name)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                >
                  <span>{role.icon}</span>
                  <span>{role.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                PIN Sesi / Sandi Sederhana <span className="text-slate-400 font-normal normal-case">(Opsional)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Boleh dikosongkan</span>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="auth-pin-input"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4-6 angka untuk mengunci sesi perangkat (opsional)"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3.5 text-xs font-mono text-slate-950 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          {/* Tombol Masuk Tanpa Email */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Memproses Masuk...' : 'Masuk Sekarang (Tanpa Email)'}</span>
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">atau masuk instan</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Action Buttons: 1-Click Instant Guest & Google */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            id="btn-auth-instant"
            type="button"
            onClick={handleInstantGuestLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>1-Klik Masuk Instan</span>
          </button>

          <button
            id="btn-auth-google"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-all disabled:opacity-60 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Akun Google</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Sistem otomatis membuat sesi ID lokal & cloud terenkripsi tanpa membutuhkan registrasi email.
        </p>

      </div>
    </div>
  );
};
