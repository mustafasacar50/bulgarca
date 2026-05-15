import React, { useState } from 'react';
import { LogIn, Github, Shield, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth, UserRole } from '../state/AuthContext';
import { motion } from 'framer-motion';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !token) {
      setError('Lütfen kullanıcı adı ve token giriniz.');
      return;
    }
    login(username, token, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
            <LogIn size={32} />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">Hoş Geldiniz</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium italic">Bulgarca öğrenme serüvenine devam et</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm animate-shake">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Giriş Modu</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                    role === 'user' 
                    ? 'border-primary-500 bg-primary-50 text-primary-600' 
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <UserIcon size={18} />
                  Öğrenci
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                    role === 'admin' 
                    ? 'border-slate-900 bg-slate-900 text-white' 
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <Shield size={18} />
                  Yönetici
                </button>
              </div>
            </div>

            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="GitHub Kullanıcı Adı"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="GitHub Access Token (PAT)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider active:scale-[0.98]"
            >
              Giriş Yap
            </button>
          </div>
          
          <p className="text-[10px] text-slate-400 text-center leading-relaxed px-4 italic">
            * Verileriniz güvenliğiniz için sadece sizin GitHub reponuzda (`bulgarca-user-data`) saklanır.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
