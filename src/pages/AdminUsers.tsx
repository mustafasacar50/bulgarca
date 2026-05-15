import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, User, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { getGithubFile, saveJsonToGithub } from '../engine/githubSync';
import { motion } from 'framer-motion';

interface UserProfile {
  username: string;
  email?: string;
  password?: string;
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
  const [systemExists, setSystemExists] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', email: '', password: '' });

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
      
      if (userRes === null && requestRes === null) {
        setSystemExists(false);
      } else {
        setSystemExists(true);
        setUsers(userRes?.content || []);
        setRequests(requestRes?.content || []);
      }
    } catch (e) {
      console.error("Data load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    if (!confirm(`${request.username} isimli öğrenciyi onaylamak istiyor musunuz?`)) return;
    
    setLoading(true);
    try {
      // 1. Prepare new user object
      const newUser: UserProfile = {
        username: request.username,
        email: request.email,
        password: request.password,
        role: 'user',
        joinedAt: new Date().toISOString(),
        progress: 0
      };

      // 2. Add to users.json
      const updatedUsers = [...users, newUser];
      await saveJsonToGithub(config, 'registry/users.json', updatedUsers, `Approve user ${request.username}`);

      // 3. Remove from requests.json
      const updatedRequests = requests.filter(r => r.username !== request.username);
      await saveJsonToGithub(config, 'registry/requests.json', updatedRequests, `Remove request for ${request.username}`);

      // 4. Reload data
      await loadData();
      alert("Kullanıcı başarıyla onaylandı!");
    } catch (e) {
      console.error("Approval error:", e);
      alert("Onaylama sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (request: any) => {
    if (!confirm(`${request.username} isimli başvuruyu reddetmek istediğinize emin misiniz?`)) return;
    
    setLoading(true);
    try {
      const updatedRequests = requests.filter(r => r.username !== request.username);
      await saveJsonToGithub(config, 'registry/requests.json', updatedRequests, `Reject request for ${request.username}`);
      await loadData();
    } catch (e) {
      console.error("Rejection error:", e);
    } finally {
      setLoading(false);
    }
  };

  const initializeRegistry = async () => {
    setLoading(true);
    try {
      // Create empty files sequentially to avoid race conditions
      await saveJsonToGithub(config, 'registry/users.json', [], 'Initialize users registry');
      await saveJsonToGithub(config, 'registry/requests.json', [], 'Initialize requests registry');
      await loadData();
      alert("Sistem başarıyla kuruldu!");
    } catch (e) {
      console.error("Initialization error:", e);
      alert("Sistem dosyaları oluşturulurken hata oluştu. Token yetkilerini kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.email || !newUserData.password) return;
    
    setLoading(true);
    try {
      const newUser: UserProfile = {
        username: newUserData.username,
        email: newUserData.email,
        password: newUserData.password,
        role: 'user',
        joinedAt: new Date().toISOString(),
        progress: 0
      };

      // In a real app, you'd also save the password somewhere or handle it.
      // For now, we add to users.json (the manual login logic will need this).
      const updatedUsers = [...users, newUser];
      await saveJsonToGithub(config, 'registry/users.json', updatedUsers, `Manual add user ${newUser.username}`);
      
      await loadData();
      setShowAddModal(false);
      setNewUserData({ username: '', email: '', password: '' });
      alert("Kullanıcı başarıyla eklendi!");
    } catch (e) {
      console.error("Manual add error:", e);
      alert("Kullanıcı eklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (username: string) => {
    if (!confirm(`${username} isimli kullanıcıyı tamamen silmek istediğinize emin misiniz?`)) return;
    
    setLoading(true);
    try {
      const updatedUsers = users.filter(u => u.username !== username);
      await saveJsonToGithub(config, 'registry/users.json', updatedUsers, `Remove user ${username}`);
      await loadData();
      alert("Kullanıcı silindi.");
    } catch (e) {
      console.error("Remove error:", e);
      alert("Kullanıcı silinemedi.");
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

          {!loading && !systemExists && (
            <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-700">Sistem dosyaları eksik!</span>
              <button 
                onClick={initializeRegistry}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700"
              >
                SİSTEMİ KUR
              </button>
            </div>
          )}
          
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
                        <div className="text-[10px] text-slate-400 font-medium">{u.email || 'Email yok'}</div>
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
                          <button 
                            onClick={() => alert(`Kullanıcı Detayları:\n\nİsim: ${u.username}\nE-posta: ${u.email || 'Belirtilmedi'}\nRol: ${u.role}\nKayıt: ${new Date(u.joinedAt).toLocaleString('tr-TR')}\nİlerleme: %${u.progress || 0}`)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" 
                            title="Detaylar"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button 
                            onClick={() => handleRemoveUser(u.username)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleApprove(u)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                          >
                            ONAYLA
                          </button>
                          <button 
                            onClick={() => handleReject(u)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-all"
                          >
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
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-primary-50 transition-all active:scale-95 shadow-lg"
          >
            Hemen Ekle
          </button>
        </div>
        
        <div className="bg-primary-50 border-2 border-primary-100 p-8 rounded-[2rem] space-y-4">
          <h3 className="text-xl font-black text-slate-900">Veri Güvenliği</h3>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">Kullanıcı ilerleme verileri GitHub reposunda şifrelenmiş veya açık formatta saklanabilir. Şu anki yapı her kullanıcı için ayrı bir klasör mimarisi üzerine kuruludur.</p>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900">Kullanıcı Ekle</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <RefreshCw className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                    value={newUserData.username}
                    onChange={e => setNewUserData({...newUserData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-posta</label>
                  <input 
                    type="email"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                    value={newUserData.email}
                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Şifre</label>
                  <input 
                    type="password"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                    value={newUserData.password}
                    onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 uppercase tracking-wider text-xs"
                  >
                    KAYDET
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
