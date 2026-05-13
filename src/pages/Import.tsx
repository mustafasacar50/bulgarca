import React, { useState } from 'react';
import { Upload, FileJson, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export function Import() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const handleImport = async () => {
    try {
      const data = JSON.parse(jsonInput);
      
      // Basic validation
      if (!data.patch_type && !data.lesson_id) {
        throw new Error('Geçersiz JSON formatı. Patch veya Ders dosyası bekleniyor.');
      }

      // In a real static app, we can't save to public/data persistently.
      // But we can simulate it or tell the user to use the seed package.
      // For this MVP, we show a success message.
      
      setStatus({ 
        type: 'success', 
        message: `${data.patch_type || 'Ders'} başarıyla doğrulandı. (Statik sürümde dosyalar manuel olarak public/data klasörüne eklenmelidir.)` 
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">İçerik İçe Aktar</h1>
        <p className="text-slate-500">Yeni dersleri veya yamaları (patch) JSON formatında sisteme yükleyin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Upload size={20} className="text-primary-500" />
              Dosya Yükle
            </h3>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-4 hover:border-primary-300 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileJson size={48} className="mx-auto text-slate-300" />
              <p className="text-sm text-slate-500">JSON dosyasını buraya sürükleyin veya tıklayın</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              Doğrulama Durumu
            </h3>
            {status.type !== 'idle' ? (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <p className="text-sm">{status.message}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Henüz bir dosya işlenmedi.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Save size={20} className="text-blue-500" />
            Metin Yapıştır
          </h3>
          <textarea 
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"lesson_id": "...", ...}'
            className="w-full h-80 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
          />
          <button 
            onClick={handleImport}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            İçeriği İşle ve Doğrula
          </button>
        </div>
      </div>
    </div>
  );
}
