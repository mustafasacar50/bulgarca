import React, { useState, useMemo } from 'react';
import { Search, Languages, X } from 'lucide-react';
import { useGlossary } from '../state/GlossaryContext';
import { transliterateCyrillic } from '../utils/textFormat';

export function SidebarSearch() {
  const { entries, isLoading } = useGlossary();
  const [query, setQuery] = useState("");
  const [latinQuery, setLatinQuery] = useState("");

  const results = useMemo(() => {
    const normalize = (txt: string) => txt.toLowerCase()
      .replace(/ş/g, 'sh')
      .replace(/ç/g, 'ch')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/j/g, 'zh')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o');

    const q = query.toLowerCase().trim();
    const lq = normalize(latinQuery.trim());
    
    if (q.length < 2 && lq.length < 2) return [];
    
    return entries.filter(item => {
      const bg = (item.bg || "").toLowerCase();
      const tr = (item.tr || "").toLowerCase();
      const latin = normalize(transliterateCyrillic(bg));
      
      const matchesNormal = !q || bg.includes(q) || tr.includes(q);
      const matchesLatin = !lq || latin.includes(lq);
      
      return matchesNormal && matchesLatin;
    }).slice(0, 15);
  }, [query, latinQuery, entries]);

  if (isLoading) return null;

  return (
    <div className="px-4 py-2 flex-1 flex flex-col min-h-0 space-y-3 relative">
      {/* Input Group - Fixed at top of this area */}
      <div className="space-y-2 shrink-0">
        {/* Normal Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={14} />
          <input 
            type="text"
            placeholder="TR / BG Ara..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Latin Search */}
        <div className="relative group">
          <Languages className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
          <input 
            type="text"
            placeholder="Latin harf ile ara..."
            className="w-full pl-9 pr-8 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm placeholder:text-indigo-200"
            value={latinQuery}
            onChange={(e) => setLatinQuery(e.target.value)}
          />
          {latinQuery && (
            <button 
              onClick={() => setLatinQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-200 hover:text-indigo-500"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results - Scrollable area */}
      {(results.length > 0 || (query.length >= 2 || latinQuery.length >= 2)) && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-white/50 border border-indigo-50 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c7d2fe; }
          `}</style>
          <div className="sticky top-0 z-10 p-2 border-b border-indigo-50/50 bg-indigo-50/90 backdrop-blur-sm flex justify-between items-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Sonuçlar</span>
            <span className="text-[9px] font-bold text-indigo-300">{results.length} eşleşme</span>
          </div>
          <div className="divide-y divide-slate-50">
            {results.length > 0 ? results.map((item, i) => (
              <div key={i} className="p-3 hover:bg-white/80 transition-colors group cursor-default">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.bg}</div>
                  <div className="text-[9px] text-slate-300 font-mono">s.{item.source_page || item.source?.page || '??'}</div>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{item.tr}</div>
                <div className="text-[9px] text-indigo-300 mt-1 italic flex items-center gap-1">
                  <Languages size={10} />
                  {transliterateCyrillic(item.bg)}
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-xs text-slate-300 italic">Sonuç bulunamadı.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
