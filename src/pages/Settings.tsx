import React from 'react';
import { GitHubSyncPanel } from '../components/GitHubSyncPanel';
import { Shield, Smartphone, Bell, HelpCircle, Palette } from 'lucide-react';
import { AppearanceSettings } from '../components/AppearanceSettings';
import { useAuth } from '../state/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500">Uygulama tercihlerini ve senkronizasyonu yönetin.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Palette size={20} className="text-primary-500" />
            Görünüm Ayarları
          </h3>
          <AppearanceSettings />
        </div>

        {isAdmin && <GitHubSyncPanel />}

        <div className="card divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-800">Gizlilik</div>
                <div className="text-xs text-slate-400">Veri paylaşım ayarları</div>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-slate-400">...</div>
          </div>
          
          <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-800">Cihaz Ayarları</div>
                <div className="text-xs text-slate-400">Tema ve bildirimler</div>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-slate-400">...</div>
          </div>

          <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-800">Yardım & Destek</div>
                <div className="text-xs text-slate-400">Sıkça sorulan sorular</div>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-slate-400">...</div>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Versiyon 1.0.0 (MVP)</p>
        </div>
      </div>
    </div>
  );
}
