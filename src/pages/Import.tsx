import React, { useState, useEffect } from 'react';
import { Upload, FileJson, CheckCircle2, AlertCircle, Save, Database, Github, Eye, Terminal, RefreshCw, Layers, ChevronRight, XCircle } from 'lucide-react';
import { storage } from '../engine/storage';
import { applyImportBundleToGithub } from '../engine/githubSync';
import { Modal } from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export function Import() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<{ 
    type: 'idle' | 'success' | 'error' | 'syncing' | 'warning', 
    message: string, 
    details?: any 
  }>({ type: 'idle', message: '' });
  const [token, setToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [importSummary, setImportSummary] = useState<any>(null);

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

  const handleApplyToGithub = async (force = false) => {
    if (!token) return;
    
    const isValid = handleValidate();
    if (!isValid) return;
    
    const bundle = JSON.parse(jsonInput);
    const bid = bundle.package_id || bundle.bundle_id;
    
    setStatus({ type: 'syncing', message: 'GitHub\'a uygulanıyor...', details: { package_id: bid } });
    setImportSummary(null);

    try {
      const config = {
        token,
        owner: 'mustafasacar50',
        repo: 'bulgarca',
        branch: 'main'
      };

      const result = await applyImportBundleToGithub(config, bundle, {
        onProgress: (msg) => setProgressMsg(msg),
        force
      });

      setImportSummary(result.summary);
      setStatus({ type: 'success', message: 'Paket GitHub\'a başarıyla uygulandı!', details: result.summary });
      setShowModal(true);
    } catch (err: any) {
      if (err.message.startsWith('ALREADY_APPLIED:')) {
        setStatus({ 
          type: 'warning', 
          message: 'Bu paket daha önce uygulanmış. Tekrar uygulamak ister misiniz?',
          details: { bid }
        });
      } else {
        console.error(err);
        setStatus({ type: 'error', message: `Uygulama hatası: ${err.message}` });
      }
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">İçeriği İçe Aktar</h1>
          <p className="text-slate-500">Ders paketlerini doğrudan GitHub reposuna uygulayın.</p>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm">
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
              className="w-full h-[500px] p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-[11px] focus:ring-2 focus:ring-primary-500 outline-none resize-none shadow-inner"
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
                onClick={() => handleApplyToGithub(false)}
                disabled={!token || status.type === 'syncing'}
                className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  !token || status.type === 'syncing' 
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                    : 'bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-[0.98]'
                }`}
              >
                {status.type === 'syncing' ? <RefreshCw size={18} className="animate-spin" /> : <Github size={18} />}
                GitHub'a Uygula
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {status.type === 'warning' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                  <AlertCircle size={24} />
                  <h3 className="font-bold">Tekrar Uygulama</h3>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  "{status.details.bid}" paketi daha önce bu tarayıcıda uygulanmış olarak işaretlenmiş. 
                  Tekrar uygulamak mevcut verilerin üzerine yazabilir.
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleApplyToGithub(true)}
                    className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700"
                  >
                    Yine de Uygula (Overwrite)
                  </button>
                  <button 
                    onClick={() => setStatus({ type: 'idle', message: '' })}
                    className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    İptal Et
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Layers size={20} className="text-emerald-500" />
                  Paket Detayları
                </h3>
                {status.type === 'syncing' ? (
                  <div className="py-8 text-center space-y-4">
                    <RefreshCw size={32} className="mx-auto text-primary-500 animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{progressMsg || 'İşleniyor...'}</p>
                  </div>
                ) : status.type === 'success' && status.details ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Eklendi</div>
                        <div className="text-xl font-black text-emerald-700">{status.details.added || 0}</div>
                      </div>
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-center">
                        <div className="text-[10px] font-bold text-blue-600 uppercase">Güncellendi</div>
                        <div className="text-xl font-black text-blue-700">{status.details.updated || 0}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Atlandı</div>
                        <div className="text-xl font-black text-slate-600">{status.details.skipped || 0}</div>
                      </div>
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center">
                        <div className="text-[10px] font-bold text-rose-600 uppercase">Hata</div>
                        <div className="text-xl font-black text-rose-700">{status.details.errors || 0}</div>
                      </div>
                    </div>
                  </div>
                ) : status.type === 'error' ? (
                  <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-xs flex gap-2">
                    <XCircle size={16} className="shrink-0" />
                    {status.message}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-300">
                    <FileJson size={48} className="mx-auto opacity-20 mb-2" />
                    <p className="text-xs italic px-4">JSON doğrulandığında bilgiler burada görünecek.</p>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>

          {importSummary && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 max-h-64 overflow-y-auto">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">İşlem Günlüğü</h4>
              <div className="space-y-1">
                {importSummary.details.map((detail: string, i: number) => (
                  <div key={i} className="text-[10px] font-medium text-slate-600 py-1 border-b border-slate-50 last:border-0 flex items-start gap-2">
                    <ChevronRight size={10} className="mt-0.5 shrink-0 text-slate-300" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Güvenli Import</h4>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Yeni sistem çakışmaları (conflict) otomatik yönetir. Bir dosya değişmişse en güncel SHA değerini çekip tekrar dener.
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
            <h4 className="text-lg font-bold text-slate-800">İşlem Tamamlandı!</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              İçerik paketi GitHub'a uygulandı. {importSummary?.errors > 0 ? "Bazı hatalar oluştu, lütfen günlüğü inceleyin." : "Tüm işlemler başarıyla tamamlandı."}
            </p>
          </div>
          <button onClick={() => setShowModal(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Anladım</button>
        </div>
      </Modal>
    </div>
  );
}
