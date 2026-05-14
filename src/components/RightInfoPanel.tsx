import React from 'react';
import { X, Book, Lightbulb, Languages, ChevronRight, Info } from 'lucide-react';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { formatBulgarianText, getScriptClass } from '../utils/textFormat';
import { LearningText } from './LearningText';

interface RightInfoPanelProps {
  item: {
    type: 'rule' | 'word' | 'letter';
    data: any;
  } | null;
  onClose: () => void;
  onSelectItem: (type: 'rule' | 'word' | 'letter', data: any) => void;
}

export function RightInfoPanel({ item, onClose, onSelectItem }: RightInfoPanelProps) {
  const { settings } = useDisplaySettings();
  if (!item) return null;

  const scriptClass = getScriptClass(settings);
  const { type, data } = item;

  return (
    <aside className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-primary-600 text-white flex-shrink-0">
        <h3 className="font-bold flex items-center gap-2">
          {type === 'rule' ? <Lightbulb size={18} /> : type === 'letter' ? <Book size={18} /> : <Languages size={18} />}
          {type === 'rule' ? 'Kural Detayı' : type === 'letter' ? 'Harf Detayı' : 'Kelime Detayı'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {type === 'letter' && (
          <>
            <div>
              <div className="flex items-end gap-4 mb-4">
                <div className={`text-6xl font-bold text-slate-900 ${scriptClass}`}>
                  {settings.scriptMode === 'handwriting' ? data.hand_upper : data.print_upper}
                </div>
                <div className={`text-3xl font-medium text-slate-400 mb-1 ${scriptClass}`}>
                  {settings.scriptMode === 'handwriting' ? data.hand_lower : data.print_lower}
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

            {(data.panel_examples || data.examples) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnekler</h4>
                <div className="flex flex-wrap gap-2">
                  {(data.panel_examples || data.examples || []).map((ex: any, i: number) => (
                    <LearningText 
                      key={i} 
                      bg={typeof ex === 'string' ? ex : ex.bg} 
                      tr={typeof ex === 'string' ? '' : ex.tr}
                      detail={typeof ex === 'string' ? { bg: ex } : ex}
                      onSelect={(data) => onSelectItem('word', data)}
                      className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                    />
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
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {data.explanation_tr || data.summary_tr || data.panel_tr || data.description}
              </p>
            </div>
            
            {(data.examples || data.panel_examples) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnekler</h4>
                <div className="space-y-3">
                  {(data.examples || data.panel_examples || []).map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-800">
                        {ex.bg_singular 
                          ? (
                              <div className="flex items-center gap-2">
                                <LearningText bg={ex.bg_singular} tr={ex.tr} detail={ex} onSelect={(data) => onSelectItem('word', data)} />
                                <ChevronRight size={14} className="text-slate-300" />
                                <LearningText bg={ex.bg_plural} tr={ex.tr} detail={ex} onSelect={(data) => onSelectItem('word', data)} />
                              </div>
                            )
                          : <LearningText bg={ex.bg || ex.form} tr={ex.tr} detail={ex} onSelect={(data) => onSelectItem('word', data)} />}
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
              <div className="mb-1">
                <LearningText 
                  bg={data.bg || data.pattern || data.form} 
                  tr={data.tr} 
                  detail={data}
                  onSelect={(data) => onSelectItem('word', data)}
                  className="text-4xl font-bold text-slate-900"
                />
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
              {data.source_page && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Kaynak Sayfa</div>
                  <div className="text-sm font-medium text-slate-700">S. {data.source_page}</div>
                </div>
              )}
              {data.status === 'auto_extracted_needs_review' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-500 uppercase">Durum</div>
                  <div className="text-[10px] font-bold text-amber-700">OTOMATİK ÇIKARIM</div>
                </div>
              )}
            </div>

            {data.markers && data.markers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">İlgili Kurallar</h4>
                <div className="flex flex-wrap gap-2">
                  {data.markers.map((m: any, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">
                      {m.rule_id || m.type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.plural && (
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Çoğul</div>
                <div className="text-sm font-medium text-slate-700">
                  <LearningText bg={data.plural} tr={data.tr} detail={{ bg: data.plural, tr: data.tr }} onSelect={(data) => onSelectItem('word', data)} />
                </div>
              </div>
            )}

            {(data.notes_tr || data.note_tr) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {data.notes_tr || data.note_tr}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
