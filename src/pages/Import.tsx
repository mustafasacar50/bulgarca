import React, { useState, useEffect } from 'react';
import { Upload, FileJson, CheckCircle2, AlertCircle, Save, Database, Github, Eye, Terminal, RefreshCw, Layers } from 'lucide-react';
import { storage } from '../engine/storage';
import { applyImportBundleToGithub } from '../engine/githubSync';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';

export function Import() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error' | 'syncing', message: string, details?: any }>({ type: 'idle', message: '' });
  const [token, setToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    const savedToken = storage.get<string>('github_token') || storage.get<string>('github_token', true);
    setToken(savedToken);
  }, []);

  const handleValidate = () => {
    try {
      if (!jsonInput.trim()) throw new Error('Lütfen JSON içeriği girin.');
      const data = JSON.parse(jsonInput);
      
      const isBundle = data.package_type === "bulgarca_import_bundle" || data.bundle_type === "bulgarca_import_bundle";
      if (!isBundle) {
        throw new Error('Geçersiz paket formatı. "bulgarca_import_bundle" bekleniyor.');
      }

      const stats = {
        files: data.files?.length || 0,
        patches: data.patches?.length || 0,
        package_id: data.package_id || data.bundle_id
      };

      setStatus({ 
        type: 'success', 
        message: 'Paket başarıyla doğrulandı.',
        details: stats
      });
      return true;
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'JSON ayrıştırma hatası.' });
      return false;
    }
  };

  const handleApplyToGithub = async () => {
    if (!token) return;
    
    // Ensure data is valid before applying
    const isValid = handleValidate();
    if (!isValid) return;
    const bundle = JSON.parse(jsonInput);
    const stats = {
      files: bundle.files?.length || 0,
      patches: bundle.patches?.length || 0,
      package_id: bundle.package_id || bundle.bundle_id
    };

    setStatus({ type: 'syncing', message: 'GitHub\'a uygulanıyor...', details: stats });

    try {
      const config = {
        token,
        owner: 'mustafasacar50',
        repo: 'bulgarca',
        branch: 'main'
      };

      await applyImportBundleToGithub(config, bundle, (msg) => {
        setProgressMsg(msg);
      });

      setStatus({ type: 'success', message: 'Paket GitHub\'a başarıyla uygulandı!', details: stats });
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: `Uygulama hatası: ${err.message}` });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">İçeriği İçe Aktar</h1>
          <p className="text-slate-500">Ders paketlerini doğrudan GitHub reposuna uygulayın.</p>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
              <CheckCircle2 size={14} /> GITHUB BAĞLI
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold border border-slate-200">
              <AlertCircle size={14} /> TOKEN YOK
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Terminal size={20} className="text-primary-500" />
                Bundle JSON
              </h3>
              <div className="flex gap-2">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".json" />
                  DOSYA YÜKLE
                </label>
                <button onClick={() => setJsonInput('')} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-100 transition-colors">TEMİZLE</button>
              </div>
            </div>
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Import Bundle JSON yapıştırın...'
              className="w-full h-96 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleValidate}
                disabled={status.type === 'syncing'}
                className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={18} /> İçeriği Doğrula
              </button>
              <button 
                onClick={handleApplyToGithub}
                disabled={!token || status.type === 'syncing'}
                className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  !token || status.type === 'syncing' 
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                    : 'bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700'
                }`}
              >
                {status.type === 'syncing' ? <RefreshCw size={18} className="animate-spin" /> : <Github size={18} />}
                GitHub'a Uygula
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Layers size={20} className="text-emerald-500" />
              Paket Detayları
            </h3>
            {status.type === 'syncing' ? (
              <div className="py-8 text-center space-y-4">
                <RefreshCw size={32} className="mx-auto text-primary-500 animate-spin" />
                <p className="text-xs font-medium text-slate-600">{progressMsg || 'İşleniyor...'}</p>
              </div>
            ) : status.type === 'success' && status.details ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Paket Kimliği</div>
                  <div className="text-sm font-bold text-slate-800 truncate">{status.details.package_id}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosyalar</div>
                    <div className="text-xl font-black text-slate-800">{status.details.files}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yamalar</div>
                    <div className="text-xl font-black text-slate-800">{status.details.patches}</div>
                  </div>
                </div>
              </div>
            ) : status.type === 'error' ? (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-xs flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {status.message}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-300">
                <FileJson size={48} className="mx-auto opacity-20 mb-2" />
                <p className="text-xs italic">JSON doğrulandığında bilgiler burada görünecek.</p>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-900 rounded-3xl text-white space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Bilgi</h4>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {token 
                ? "GitHub token bağlı. Bu paket otomatik olarak 'mustafasacar50/bulgarca' reposuna commit edilecek." 
                : "GitHub token bağlı değil. Sadece tarayıcıda önizleme yapabilirsiniz. Token girmek için Ayarlar sayfasına gidin."}
            </p>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Başarılı!">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 size={48} />
            </motion.div>
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-800">Paket Uygulandı!</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              İçerik paketi GitHub'a başarıyla commit edildi. Localhost'ta değişiklikleri görmek için <code className="bg-slate-100 px-1 rounded">git pull</code> yapın.
            </p>
          </div>
          <button onClick={() => setShowModal(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Anladım</button>
        </div>
      </Modal>
    </div>
  );
}
