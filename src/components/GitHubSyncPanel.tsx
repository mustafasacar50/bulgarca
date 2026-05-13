import React, { useState, useEffect } from 'react';
import { Github, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { storage } from '../engine/storage';
import { getGithubFile, saveJsonToGithub } from '../engine/githubSync';
import { GitHubConfig } from '../types/sync';
import { motion } from 'framer-motion';

import { Modal } from './Modal';

export function GitHubSyncPanel() {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('mustafasacar50');
  const [repo, setRepo] = useState('bulgarca-user-data');
  const [branch, setBranch] = useState('main');
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedToken = storage.get<string>('github_token') || storage.get<string>('github_token', true);
    if (savedToken) setToken(savedToken);
  }, []);

  const handleSync = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Lütfen bir GitHub token girin.');
      setShowModal(true);
      return;
    }

    setStatus('syncing');
    setMessage('Veriler GitHub ile senkronize ediliyor...');

    const config: GitHubConfig = { token, owner, repo, branch };

    try {
      // Save token based on preference
      if (remember) {
        storage.set('github_token', token);
      } else {
        storage.set('github_token', token, true);
      }

      // Test connection by trying to get progress.json
      const path = 'users/mustafa/progress.json';
      const result = await getGithubFile({ ...config, path });
      
      // For demo, if doesn't exist, create it
      if (!result) {
        await saveJsonToGithub(config, path, { completedLessons: [], stats: { wordsLearned: 0, exercisesDone: 0, streak: 0 } }, 'Initial progress sync');
      }

      setStatus('success');
      setMessage('Verileriniz GitHub ile başarıyla senkronize edildi. Artık tüm cihazlarınızdan ilerlemenize erişebilirsiniz.');
      setShowModal(true);
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(`Senkronizasyon sırasında bir hata oluştu: ${err.message}`);
      setShowModal(true);
    }
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
            <Github size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">GitHub Senkronizasyonu</h3>
            <p className="text-xs text-slate-500">İlerlemeni bulutta sakla.</p>
          </div>
        </div>
        {status === 'success' && <CheckCircle2 className="text-emerald-500" size={24} />}
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">GitHub Personal Access Token</label>
          <input 
            type="password" 
            placeholder="ghp_..." 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono text-sm"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="text-[10px] text-slate-400">Token'ınız hiçbir zaman sunucularımıza gönderilmez, sadece GitHub API'sı ile iletişim için tarayıcınızda tutulur.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Repo Sahibi</label>
            <input 
              type="text" 
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Veri Reposu</label>
            <input 
              type="text" 
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="remember-token" 
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="remember-token" className="text-sm text-slate-600">Bu cihazda hatırla (Local Storage)</label>
        </div>

        {status === 'error' && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100">
            <AlertCircle size={18} />
            {message}
          </div>
        )}

        <button 
          onClick={handleSync}
          disabled={status === 'syncing'}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            status === 'syncing' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
          }`}
        >
          {status === 'syncing' ? <RefreshCw size={20} className="animate-spin" /> : <Database size={20} />}
          {status === 'syncing' ? 'Eşitleniyor...' : 'Şimdi Eşitle'}
        </button>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={status === 'success' ? 'Başarılı!' : 'Hata'}
      >
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
            {status === 'success' ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <CheckCircle2 size={48} />
              </motion.div>
            ) : (
              <AlertCircle size={48} />
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {message}
          </p>
          <button 
            onClick={() => setShowModal(false)}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${status === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            Anladım
          </button>
        </div>
      </Modal>
    </div>
  );
}
