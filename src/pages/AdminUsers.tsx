import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, User, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { getGithubFile, saveJsonToGithub } from '../engine/githubSync';
import { motion } from 'framer-motion';

interface UserProfile {
  username: string;
  role: 'admin' | 'user';
  joinedAt: string;
  lastActive?: string;
  progress?: number;
}

export function AdminUsers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'requests'>('active');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const config = {
    token: user?.token || '',
    owner: 'mustafasacar50',
    repo: 'bulgarca-user-data',
    branch: 'main'
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, requestRes] = await Promise.all([
        getGithubFile({ ...config, path: 'registry/users.json' }),
        getGithubFile({ ...config, path: 'registry/requests.json' })
      ]);
      if (userRes?.content) setUsers(userRes.content);
      if (requestRes?.content) setRequests(requestRes.content);
    } catch (e) {
      console.error("Data load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users size={32} className="text-primary-600" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-slate-500 font-medium">Sisteme kayıtlı tüm öğrenci ve yöneticileri yönetin.</p>
        </div>
        <button 
          onClick={loadData}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Aktif Kullanıcılar ({users.length})
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Kayıt Talepleri ({requests.length})
            </button>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı</th>
                {activeTab === 'active' ? (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">İlerleme</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-posta</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Talep Tarihi</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                  </>
                )}
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic">Yükleniyor...</td></tr>
              ) : (activeTab === 'active' ? filteredUsers : requests).length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic">Kayıt bulunamadı.</td></tr>
              ) : (activeTab === 'active' ? filteredUsers : requests).map((u, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${u.role === 'admin' ? 'bg-slate-900' : 'bg-emerald-500'}`}>
                        {(u.username || u.name).slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{u.username || u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {btoa(u.username || u.name).slice(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  {activeTab === 'active' ? (
                    <>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                          {u.role === 'admin' ? 'Yönetici' : 'Öğrenci'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 font-medium">{new Date(u.joinedAt).toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-4">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500" style={{ width: `${u.progress || 0}%` }} />
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 text-xs text-slate-600">{u.email}</td>
                      <td className="px-4 py-4 text-xs text-slate-500">{new Date(u.requestedAt || Date.now()).toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Bekliyor</span>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {activeTab === 'active' ? (
                        <>
                          <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Detaylar">
                            <ExternalLink size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Sil">
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                            ONAYLA
                          </button>
                          <button className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-all">
                            REDDET
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-4 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <UserPlus size={120} />
          </div>
          <h3 className="text-xl font-black">Manuel Kullanıcı Ekle</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Yeni bir öğrenciyi sisteme manuel olarak kaydedin. Bu işlem kullanıcıya reponuzda bir klasör açacaktır.</p>
          <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-primary-50 transition-all active:scale-95 shadow-lg">
            Hemen Ekle
          </button>
        </div>
        
        <div className="bg-primary-50 border-2 border-primary-100 p-8 rounded-[2rem] space-y-4">
          <h3 className="text-xl font-black text-slate-900">Veri Güvenliği</h3>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">Kullanıcı ilerleme verileri GitHub reposunda şifrelenmiş veya açık formatta saklanabilir. Şu anki yapı her kullanıcı için ayrı bir klasör mimarisi üzerine kuruludur.</p>
        </div>
      </div>
    </div>
  );
}
