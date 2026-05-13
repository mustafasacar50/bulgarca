import React from 'react';
import { X, Book, Lightbulb, Languages } from 'lucide-react';
import { Rule } from '../types/rule';
import { VocabularyItem } from '../types/lesson';

interface RightInfoPanelProps {
  item: {
    type: 'rule' | 'word';
    data: Rule | VocabularyItem;
  } | null;
  onClose: () => void;
}

export function RightInfoPanel({ item, onClose }: RightInfoPanelProps) {
  if (!item) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-full md:w-80 bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          {item.type === 'rule' ? <Lightbulb size={18} className="text-amber-500" /> : <Languages size={18} className="text-blue-500" />}
          {item.type === 'rule' ? 'Kural Detayı' : 'Kelime Detayı'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {item.type === 'rule' ? (
          <>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kural Kalıbı</div>
              <div className="text-2xl font-bold text-primary-600">{(item.data as Rule).pattern}</div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Açıklama</div>
              <p className="text-slate-600 leading-relaxed">{(item.data as Rule).description}</p>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Örnekler</div>
              {(item.data as Rule).examples.map((ex, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-800">{ex.bg}</div>
                  <div className="text-sm text-slate-500">{ex.tr}</div>
                  {ex.plural && <div className="mt-1 text-xs text-primary-600 font-medium">Çoğul: {ex.plural}</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1 text-center py-4">
              <div className="text-3xl font-bold text-slate-900">{(item.data as VocabularyItem).bg}</div>
              <div className="text-lg text-slate-500">{(item.data as VocabularyItem).tr}</div>
              {(item.data as VocabularyItem).pronunciation && (
                <div className="text-sm text-primary-500 font-medium mt-1">[{ (item.data as VocabularyItem).pronunciation }]</div>
              )}
            </div>
            
            {((item.data as VocabularyItem).plural || (item.data as VocabularyItem).note) && (
              <div className="space-y-4">
                {(item.data as VocabularyItem).plural && (
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="text-[10px] uppercase font-bold text-primary-400 tracking-wider mb-1">Çoğul Hali</div>
                    <div className="text-lg font-bold text-primary-700">{(item.data as VocabularyItem).plural}</div>
                  </div>
                )}
                {(item.data as VocabularyItem).note && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Önemli Not</div>
                    <p className="text-sm text-slate-600">{(item.data as VocabularyItem).note}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
