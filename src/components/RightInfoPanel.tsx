import React from 'react';
import { X, Book, Lightbulb, Languages, ChevronRight, Info } from 'lucide-react';
import { useDisplayPreferences } from '../state/DisplayPreferencesContext';
import { formatBulgarianText, getScriptClass } from '../utils/textFormat';

interface RightInfoPanelProps {
  item: {
    type: 'rule' | 'word' | 'letter';
    data: any;
  } | null;
  onClose: () => void;
}

export function RightInfoPanel({ item, onClose }: RightInfoPanelProps) {
  const { preferences } = useDisplayPreferences();
  if (!item) return null;

  const scriptClass = getScriptClass(preferences);
  const { type, data } = item;

  const renderWithMarkers = (text: string, markers: any[]) => {
    if (preferences.markerMode === "off" || !markers || markers.length === 0) {
      return formatBulgarianText(text, preferences);
    }
    
    let result: React.ReactNode[] = [formatBulgarianText(text, preferences)];
    
    // Note: markers in data might refer to original casing, we need to be careful.
    // For now, simple replacement if match found.
    markers.forEach(marker => {
      const source = formatBulgarianText(marker.source || marker.from, preferences);
      const target = formatBulgarianText(marker.target || marker.to || marker.from, preferences);

      const newResult: React.ReactNode[] = [];
      result.forEach(segment => {
        if (typeof segment !== 'string') {
          newResult.push(segment);
          return;
        }
        
        const parts = segment.split(source);
        parts.forEach((part, i) => {
          newResult.push(part);
          if (i < parts.length - 1) {
            newResult.push(
              <span 
                key={`${source}-${i}`} 
                className={preferences.markerMode === 'strong' ? 'bg-primary-500 text-white px-1 rounded' : 'bg-primary-100 px-1 rounded border-b border-primary-300'}
                title={marker.tooltip_tr}
              >
                {target}
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
    <aside className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-primary-600 text-white">
        <h3 className="font-bold flex items-center gap-2">
          {type === 'rule' ? <Lightbulb size={18} /> : type === 'letter' ? <Book size={18} /> : <Languages size={18} />}
          {type === 'rule' ? 'Kural Detayı' : type === 'letter' ? 'Harf Detayı' : 'Kelime Detayı'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
        {type === 'letter' && (
          <>
            <div>
              <div className="flex items-end gap-4 mb-4">
                <div className={`text-6xl font-bold text-slate-900 ${scriptClass}`}>
                  {preferences.scriptMode === 'handwriting' ? data.hand_upper : data.print_upper}
                </div>
                <div className={`text-3xl font-medium text-slate-400 mb-1 ${scriptClass}`}>
                  {preferences.scriptMode === 'handwriting' ? data.hand_lower : data.print_lower}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Latin</div>
                  <div className="text-lg font-bold text-slate-700">{data.latin_hint || data.transliteration}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ses</div>
                  <div className="text-lg font-bold text-primary-600">{data.sound}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Açıklama</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{data.note_tr || data.tr_hint}</p>
            </div>

            {data.panel_examples && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnek Kelimeler</h4>
                <div className="flex flex-wrap gap-2">
                  {data.panel_examples.map((ex: string, i: number) => (
                    <span key={i} className={`px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium ${scriptClass}`}>
                      {formatBulgarianText(ex, preferences)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'rule' && (
          <>
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-2">{data.title_tr || data.display || data.title}</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {data.explanation_tr || data.summary_tr || data.panel_tr || data.description}
              </p>
            </div>
            
            {(data.examples || data.panel_examples) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnekler</h4>
                <div className="space-y-3">
                  {(data.examples || data.panel_examples).map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className={`font-bold text-slate-800 ${scriptClass}`}>
                        {ex.bg_singular 
                          ? (
                              <div className="flex items-center gap-2">
                                <span>{formatBulgarianText(ex.bg_singular, preferences)}</span>
                                <ChevronRight size={14} className="text-slate-300" />
                                <span>{renderWithMarkers(ex.bg_plural, ex.markers)}</span>
                              </div>
                            )
                          : renderWithMarkers(ex.bg, ex.markers)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{ex.tr}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'word' && (
          <>
            <div className="text-center py-4">
              <div className={`text-4xl font-bold text-slate-900 mb-1 ${scriptClass}`}>
                {formatBulgarianText(data.bg || data.pattern || data.form, preferences)}
              </div>
              <div className="text-xl text-primary-600 font-medium">{data.tr}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {data.pronunciation && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Okunuş</div>
                  <div className="text-sm font-medium text-slate-700">/{data.pronunciation}/</div>
                </div>
              )}
              {data.gender && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cinsiyet</div>
                  <div className="text-sm font-medium text-slate-700">{data.gender}</div>
                </div>
              )}
            </div>

            {data.plural && (
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Çoğul</div>
                <div className={`text-sm font-medium text-slate-700 ${scriptClass}`}>
                  {formatBulgarianText(data.plural, preferences)}
                </div>
              </div>
            )}

            {data.notes_tr && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {data.notes_tr}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
