import React from 'react';
import { X, Book, Lightbulb, Languages, ChevronRight, Info } from 'lucide-react';

interface RightInfoPanelProps {
  item: {
    type: 'rule' | 'word' | 'letter';
    data: any;
  } | null;
  onClose: () => void;
  showMarkers?: boolean;
}

export function RightInfoPanel({ item, onClose, showMarkers = true }: RightInfoPanelProps) {
  if (!item) return null;

  const renderWithMarkers = (text: string, markers: any[]) => {
    if (!showMarkers || !markers || markers.length === 0) return text;
    
    let result: React.ReactNode[] = [text];
    
    markers.forEach(marker => {
      const newResult: React.ReactNode[] = [];
      result.forEach(segment => {
        if (typeof segment !== 'string') {
          newResult.push(segment);
          return;
        }
        
        const parts = segment.split(marker.from);
        parts.forEach((part, i) => {
          newResult.push(part);
          if (i < parts.length - 1) {
            newResult.push(
              <span key={`${marker.from}-${i}`} className="marker-highlight">
                {marker.to || marker.from}
              </span>
            );
          }
        });
      });
      result = newResult;
    });
    
    return result;
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-full md:w-80 bg-white border-l border-slate-200 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-primary-600 text-white">
        <h3 className="font-bold flex items-center gap-2">
          {item.type === 'rule' ? <Lightbulb size={18} /> : item.type === 'letter' ? <Book size={18} /> : <Languages size={18} />}
          {item.type === 'rule' ? 'Kural Detayı' : item.type === 'letter' ? 'Harf Detayı' : 'Kelime Detayı'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {item.type === 'letter' && (
          <>
            <div>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-6xl font-bold text-slate-900">{item.data.print_upper}</div>
                <div className="text-3xl font-medium text-slate-400 mb-1">{item.data.print_lower}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Latin Karşılık</div>
                  <div className="text-lg font-bold text-slate-700">{item.data.latin_hint}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ses</div>
                  <div className="text-lg font-bold text-primary-600">{item.data.sound}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Açıklama</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{item.data.note_tr}</p>
            </div>

            {item.data.panel_examples && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnek Kelimeler</h4>
                <div className="flex flex-wrap gap-2">
                  {item.data.panel_examples.map((ex: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {item.type === 'rule' && (
          <>
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-2">{item.data.title_tr || item.data.display || item.data.title}</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.data.explanation_tr || item.data.summary_tr || item.data.panel_tr || item.data.description}
              </p>
            </div>
            
            {(item.data.examples || item.data.panel_examples) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnekler</h4>
                <div className="space-y-3">
                  {(item.data.examples || item.data.panel_examples).map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-800">
                        {typeof ex === 'string' 
                          ? ex 
                          : ex.bg_singular 
                            ? (
                                <div className="flex items-center gap-2">
                                  <span>{ex.bg_singular}</span>
                                  <ChevronRight size={14} className="text-slate-300" />
                                  <span>{renderWithMarkers(ex.bg_plural, ex.markers)}</span>
                                </div>
                              )
                            : ex.bg}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{ex.tr || ex.explanation_tr}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {item.type === 'word' && (
          <>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-slate-900 mb-1">{item.data.bg}</div>
              <div className="text-xl text-primary-600 font-medium">{item.data.tr}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {item.data.pronunciation && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Okunuş</div>
                  <div className="text-sm font-medium text-slate-700">/{item.data.pronunciation}/</div>
                </div>
              )}
              {item.data.gender && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cinsiyet</div>
                  <div className="text-sm font-medium text-slate-700">{item.data.gender}</div>
                </div>
              )}
            </div>

            {item.data.plural && (
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Çoğul</div>
                <div className="text-sm font-medium text-slate-700">{item.data.plural}</div>
              </div>
            )}

            {item.data.notes_tr && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {item.data.notes_tr}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
