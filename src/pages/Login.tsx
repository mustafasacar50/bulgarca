import React, { useState } from 'react';
import { LogIn, Github, Shield, User as UserIcon, AlertCircle, UserPlus, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth, UserRole } from '../state/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function LoginPage() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(''); // Only for Admin manual login
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          <div className="mx-auto h-20 w-20 bg-primary-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary-200 mb-6 rotate-3 hover:rotate-0 transition-transform">
            {activeTab === 'login' ? <LogIn size={36} /> : <UserPlus size={36} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === 'login' ? 'Tekrar Hoş Geldin!' : 'Yeni Bir Başlangıç'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium italic">
            {activeTab === 'login' ? 'Bulgarca yolculuğuna kaldığın yerden devam et.' : 'Öğrenci topluluğumuza katılmak için formu doldur.'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Giriş Yap
          </button>
          <button 
            onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5" 
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm animate-shake">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">KİMLİK TÜRÜ</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-xs ${
                        role === 'user' 
                        ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm shadow-primary-100' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <UserIcon size={16} />
                      ÖĞRENCİ
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-xs ${
                        role === 'admin' 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-200' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Shield size={16} />
                      YÖNETİCİ
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Kullanıcı Adı"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {role === 'admin' ? (
                  <div className="relative group">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="GitHub Access Token (PAT)"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-medium"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="Giriş Şifresi / Kod"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-100 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider active:scale-[0.98]"
              >
                Giriş Yap
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSuccess('Kayıt başvurunuz alındı! Yönetici onayı bekliyor.');
              }}
            >
              {success ? (
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-emerald-800 font-bold">Başvuru Başarılı</p>
                    <p className="text-xs text-emerald-600">Yönetici hesabınızı onayladığında giriş yapabileceksiniz.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('login')}
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                  >
                    Giriş Ekranına Dön
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="Ad Soyad veya Kullanıcı Adı"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input
                        type="email"
                        placeholder="E-posta Adresi"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input
                        type="password"
                        placeholder="Şifre Belirleyin"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider active:scale-[0.98]"
                  >
                    Başvuru Yap
                  </button>
                </>
              )}
            </motion.form>
          )}
        </AnimatePresence>
          
          <p className="text-[10px] text-slate-400 text-center leading-relaxed px-4 italic">
            * Verileriniz güvenliğiniz için sadece sizin GitHub reponuzda (`bulgarca-user-data`) saklanır.
          </p>
      </motion.div>
    </div>
  );
}
