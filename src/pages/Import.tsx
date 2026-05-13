import React, { useState } from 'react';
import { Upload, FileJson, CheckCircle2, AlertCircle, Save, Database, Github, Eye, Terminal } from 'lucide-react';

export function Import() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string, details?: any }>({ type: 'idle', message: '' });
  const [mode, setMode] = useState<'preview' | 'apply' | 'github'>('preview');

  const handleImport = async () => {
    try {
      const data = JSON.parse(jsonInput);
      
      // Validation
      const isBundle = data.bundle_type === "bulgarca_import_bundle";
      const isPatch = !!data.patch_type;
      const isLesson = !!data.lesson_id;

      if (!isBundle && !isPatch && !isLesson) {
        throw new Error('Geçersiz JSON formatı. Import Bundle, Patch veya Ders dosyası bekleniyor.');
      }

      const stats = {
        lessons: data.lessons?.length || (isLesson ? 1 : 0),
        exercises: data.exercises?.length || 0,
        rules: data.patches?.rules?.length || (data.patch_type === 'rules_patch' ? data.operations.length : 0),
        glossary: data.patches?.glossary?.length || (data.patch_type === 'glossary_patch' ? data.entries.length : 0),
      };

      setStatus({ 
        type: 'success', 
        message: 'JSON başarıyla doğrulandı.',
        details: stats
      });
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'JSON ayrıştırma hatası.' });
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
          <h1 className="text-3xl font-bold text-slate-900">Gelişmiş İçe Aktar</h1>
          <p className="text-slate-500">Yeni ders paketlerini ve yamaları yönetin.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setMode('preview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'preview' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Önizle</button>
          <button onClick={() => setMode('github')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'github' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>GitHub Developer</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Terminal size={20} className="text-primary-500" />
                JSON İçeriği
              </h3>
              <div className="flex gap-2">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".json" />
                  DOSYA SEÇ
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
            <button 
              onClick={handleImport}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={18} /> İçeriği Doğrula ve Önizle
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Database size={20} className="text-emerald-500" />
              Paket Özeti
            </h3>
            {status.type === 'success' && status.details ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Dersler" value={status.details.lessons} />
                  <StatCard label="Alıştırmalar" value={status.details.exercises} />
                  <StatCard label="Kurallar" value={status.details.rules} />
                  <StatCard label="Sözlük" value={status.details.glossary} />
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-medium flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5" />
                  Paket yapısı geçerli. Statik sürümde dosyaları manuel olarak public/data klasörüne taşımanız önerilir.
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <FileJson size={32} className="mx-auto opacity-20" />
                <p className="text-xs italic">Henüz paket işlenmedi.</p>
              </div>
            )}
          </div>

          {mode === 'github' && (
            <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-xl shadow-slate-200">
              <h3 className="font-bold flex items-center gap-2">
                <Github size={20} />
                Developer Modu
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Bu mod, doğrudan <code className="text-primary-400">mustafasacar50/bulgarca</code> reposuna içerik yazmanıza olanak tanır. Yazma yetkisi olan bir GitHub Token gereklidir.
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-300">
                <strong>DİKKAT:</strong> Bu işlem ders içeriklerini kalıcı olarak değiştirir.
              </div>
              <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all">
                GitHub'a Gönder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-black text-slate-800">{value}</div>
    </div>
  );
}
