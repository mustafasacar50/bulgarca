import React from 'react';
import { useDisplaySettings, ScriptMode, LetterCaseMode, LanguageMode, MarkerMode } from '../state/DisplaySettingsContext';
import { Type, PenTool, CaseUpper, CaseLower, Eye, EyeOff, Languages, Check, Highlighter, MinusCircle } from 'lucide-react';

export function AppearanceSettings() {
  const { settings, updateSettings } = useDisplaySettings();

  const TooltipBtn = ({ active, onClick, icon, label, colorClass }: any) => (
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center relative group
        ${active ? `${colorClass} shadow-sm border` : 'text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 border border-transparent'}`}
    >
      {icon}
      {/* Premium Tooltip */}
      <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-200 shadow-xl scale-95 group-hover:scale-100">
        {label}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-solid border-b-slate-800 border-b-4 border-x-transparent border-x-4 border-t-0"></div>
      </div>
    </button>
  );

  const Divider = () => <div className="hidden sm:block w-px h-6 bg-slate-200/60 rounded-full flex-shrink-0"></div>;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full justify-center lg:justify-start">
       {/* 1. YAZI TİPİ */}
       <div className="flex bg-slate-50/80 p-1 rounded-2xl border border-slate-100 shadow-inner flex-shrink-0">
         <TooltipBtn active={settings.scriptMode === 'print'} onClick={() => updateSettings({ scriptMode: 'print' })} icon={<Type size={18} strokeWidth={2.5} />} label="Basılı Harfler" colorClass="bg-white text-blue-600 border-blue-100/50" />
         <TooltipBtn active={settings.scriptMode === 'handwriting'} onClick={() => updateSettings({ scriptMode: 'handwriting' })} icon={<PenTool size={18} strokeWidth={2.5} />} label="El Yazısı" colorClass="bg-white text-blue-600 border-blue-100/50" />
       </div>

       <Divider />

       {/* 2. HARF BÜYÜKLÜĞÜ */}
       <div className="flex bg-slate-50/80 p-1 rounded-2xl border border-slate-100 shadow-inner flex-shrink-0">
         <TooltipBtn active={settings.letterCaseMode === 'normal'} onClick={() => updateSettings({ letterCaseMode: 'normal' })} icon={<span className="font-black text-[13px] leading-none tracking-tight">Aa</span>} label="Orijinal Boyut" colorClass="bg-white text-indigo-600 border-indigo-100/50" />
         <TooltipBtn active={settings.letterCaseMode === 'uppercase'} onClick={() => updateSettings({ letterCaseMode: 'uppercase' })} icon={<CaseUpper size={18} strokeWidth={2.5} />} label="Tümü Büyük" colorClass="bg-white text-indigo-600 border-indigo-100/50" />
         <TooltipBtn active={settings.letterCaseMode === 'lowercase'} onClick={() => updateSettings({ letterCaseMode: 'lowercase' })} icon={<CaseLower size={18} strokeWidth={2.5} />} label="Tümü Küçük" colorClass="bg-white text-indigo-600 border-indigo-100/50" />
       </div>

       <Divider />

       {/* 3. GÖRÜNÜM MODU */}
       <div className="flex bg-slate-50/80 p-1 rounded-2xl border border-slate-100 shadow-inner flex-shrink-0">
         <TooltipBtn active={settings.languageMode === 'bg_hover_tr'} onClick={() => updateSettings({ languageMode: 'bg_hover_tr' })} icon={<div className="flex flex-col items-center leading-none"><span className="text-[9px] font-black">BG</span><span className="text-[7px]">▼</span><span className="text-[9px] font-black">TR</span></div>} label="Bulgarca (Hover: TR)" colorClass="bg-white text-emerald-600 border-emerald-100/50" />
         <TooltipBtn active={settings.languageMode === 'tr_hover_bg'} onClick={() => updateSettings({ languageMode: 'tr_hover_bg' })} icon={<div className="flex flex-col items-center leading-none"><span className="text-[9px] font-black">TR</span><span className="text-[7px]">▼</span><span className="text-[9px] font-black">BG</span></div>} label="Türkçe (Hover: BG)" colorClass="bg-white text-emerald-600 border-emerald-100/50" />
         <TooltipBtn active={settings.languageMode === 'bg_tr'} onClick={() => updateSettings({ languageMode: 'bg_tr' })} icon={<Eye size={18} strokeWidth={2.5} />} label="Çift Dilli Gösterim" colorClass="bg-white text-emerald-600 border-emerald-100/50" />
         <TooltipBtn active={settings.languageMode === 'quiz_hidden'} onClick={() => updateSettings({ languageMode: 'quiz_hidden' })} icon={<EyeOff size={18} strokeWidth={2.5} />} label="Gizli (Quiz Modu)" colorClass="bg-white text-emerald-600 border-emerald-100/50" />
       </div>

       <Divider />

       {/* 4. VURGU MARKER */}
       <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-2xl border border-slate-100 shadow-inner pr-2 flex-shrink-0">
         <TooltipBtn active={settings.markerMode === 'off'} onClick={() => updateSettings({ markerMode: 'off' })} icon={<MinusCircle size={18} strokeWidth={2.5} />} label="Vurgu Kapalı" colorClass="bg-white text-rose-500 border-rose-100/50" />
         <TooltipBtn active={settings.markerMode === 'subtle'} onClick={() => updateSettings({ markerMode: 'subtle' })} icon={<Highlighter size={18} strokeWidth={2.5} className="opacity-50" />} label="Sade Vurgu" colorClass="bg-white text-amber-500 border-amber-100/50" />
         <TooltipBtn active={settings.markerMode === 'strong'} onClick={() => updateSettings({ markerMode: 'strong' })} icon={<Highlighter size={18} strokeWidth={2.5} />} label="Güçlü Vurgu" colorClass="bg-white text-amber-500 border-amber-100/50" />
       </div>
    </div>
  );
}
