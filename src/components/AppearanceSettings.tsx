import React from 'react';
import { useDisplayPreferences, ScriptMode, LetterCaseMode, LanguageMode, MarkerMode } from '../state/DisplayPreferencesContext';
import { Type, PenTool, CaseUpper, CaseLower, Eye, EyeOff, Languages } from 'lucide-react';

export function AppearanceSettings() {
  const { preferences, updatePreferences } = useDisplayPreferences();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
      {/* Script Mode */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yazı Tipi</label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => updatePreferences({ scriptMode: 'print' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${preferences.scriptMode === 'print' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Type size={14} /> Basılı
          </button>
          <button 
            onClick={() => updatePreferences({ scriptMode: 'handwriting' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${preferences.scriptMode === 'handwriting' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PenTool size={14} /> El Yazısı
          </button>
        </div>
      </div>

      {/* Case Mode */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harf Büyüklüğü</label>
        <select 
          value={preferences.letterCaseMode}
          onChange={(e) => updatePreferences({ letterCaseMode: e.target.value as LetterCaseMode })}
          className="w-full bg-slate-100 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="uppercase">BÜYÜK HARF</option>
          <option value="lowercase">küçük harf</option>
          <option value="titlecase_words">Kelime İlk Harf Büyük</option>
          <option value="sentencecase">Cümle İlk Harf Büyük</option>
        </select>
      </div>

      {/* Language Mode */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dil Gösterimi</label>
        <select 
          value={preferences.languageMode}
          onChange={(e) => updatePreferences({ languageMode: e.target.value as LanguageMode })}
          className="w-full bg-slate-100 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="bg_hover_tr">BG (Hover: TR)</option>
          <option value="tr_hover_bg">TR (Hover: BG)</option>
          <option value="both_bg_first">BG + TR</option>
          <option value="both_tr_first">TR + BG</option>
          <option value="quiz_hide_secondary">Quiz Modu</option>
        </select>
      </div>

      {/* Marker Mode */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marker (Vurgu)</label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['off', 'soft', 'strong'] as MarkerMode[]).map((mode) => (
            <button 
              key={mode}
              onClick={() => updatePreferences({ markerMode: mode })}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${preferences.markerMode === mode ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
