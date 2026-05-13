import React from 'react';
import { useDisplaySettings, ScriptMode, LetterCaseMode, LanguageMode, MarkerMode } from '../state/DisplaySettingsContext';
import { Type, PenTool, CaseUpper, CaseLower, Eye, EyeOff, Languages, Check } from 'lucide-react';

export function AppearanceSettings() {
  const { settings, updateSettings } = useDisplaySettings();

  const OptionGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
        {children}
      </div>
    </div>
  );

  const OptionBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string }) => (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all ${active ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:bg-white/50'}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      <OptionGroup label="Yazı Tipi">
        <OptionBtn 
          active={settings.scriptMode === 'print'} 
          onClick={() => updateSettings({ scriptMode: 'print' })} 
          icon={<Type size={14} />} 
          label="BASILI" 
        />
        <OptionBtn 
          active={settings.scriptMode === 'handwriting'} 
          onClick={() => updateSettings({ scriptMode: 'handwriting' })} 
          icon={<PenTool size={14} />} 
          label="EL YAZISI" 
        />
      </OptionGroup>

      <OptionGroup label="Harf Büyüklüğü">
        <select 
          value={settings.letterCaseMode}
          onChange={(e) => updateSettings({ letterCaseMode: e.target.value as LetterCaseMode })}
          className="w-full bg-transparent border-none py-1.5 px-2 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
        >
          <option value="normal">Normal</option>
          <option value="sentencecase">Cümle Başı Büyük</option>
          <option value="uppercase">TÜMÜ BÜYÜK</option>
          <option value="lowercase">tümü küçük</option>
          <option value="titlecase">Her Kelime Büyük</option>
        </select>
      </OptionGroup>

      <OptionGroup label="Görünüm Modu">
        <select 
          value={settings.languageMode}
          onChange={(e) => updateSettings({ languageMode: e.target.value as LanguageMode })}
          className="w-full bg-transparent border-none py-1.5 px-2 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
        >
          <option value="bg_hover_tr">Bulgarca (Hover: TR)</option>
          <option value="tr_hover_bg">Türkçe (Hover: BG)</option>
          <option value="bg_tr">Bulgarca + Türkçe</option>
          <option value="quiz_hidden">Ezber/Quiz Modu</option>
        </select>
      </OptionGroup>

      <OptionGroup label="Vurgu (Marker)">
        <OptionBtn active={settings.markerMode === 'off'} onClick={() => updateSettings({ markerMode: 'off' })} label="KAPALI" />
        <OptionBtn active={settings.markerMode === 'subtle'} onClick={() => updateSettings({ markerMode: 'subtle' })} label="SADE" />
        <OptionBtn active={settings.markerMode === 'strong'} onClick={() => updateSettings({ markerMode: 'strong' })} label="GÜÇLÜ" />
      </OptionGroup>
    </div>
  );
}
