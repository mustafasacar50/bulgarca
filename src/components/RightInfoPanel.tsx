import React from 'react';
import { X, Book, Lightbulb, Languages, ChevronRight, ChevronLeft, Info, Search } from 'lucide-react';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { formatBulgarianText, getScriptClass, transliterateCyrillic } from '../utils/textFormat';
import { LearningText } from './LearningText';
import { getExamplesForLetter } from '../engine/ruleMatcher';

interface RightInfoPanelProps {
  item: {
    type: 'rule' | 'word' | 'letter';
    data: any;
    navigation?: {
      list: any[];
      currentIndex: number;
      contextRule?: any;
    };
  } | null;
  onClose: () => void;
  onSelectItem: (type: 'rule' | 'word' | 'letter', data: any, navigation?: any) => void;
  onSearchRule?: (ruleId: string) => void;
  allRules?: Record<string, any>;
  glossary?: any[];
}

export function RightInfoPanel({ item, onClose, onSelectItem, onSearchRule, allRules, glossary }: RightInfoPanelProps) {
  const { settings } = useDisplaySettings();

  const normalize = (text: string) => {
    if (!text) return "";
    let t = text.toLowerCase().trim();
    const scriptMap: Record<string, string> = {
      'a': 'а', 'o': 'о', 'e': 'е', 'p': 'р', 'x': 'х', 'y': 'у', 'c': 'с', 't': 'т'
    };
    return t.split('').map(char => scriptMap[char] || char).join('');
  };
  
  const matchCount = React.useMemo(() => {
    if (!glossary || !item || item.type !== 'rule') return 0;
    const { data, navigation } = item;
    const ruleObj = navigation?.contextRule || data;
    const rid = ruleObj.rule_id || ruleObj.id;
    if (!rid && !ruleObj.title_tr && !ruleObj.display) return 0;

    const patternSources: string[] = [];
    if (rid) patternSources.push(rid);
    if (ruleObj.title_tr) patternSources.push(ruleObj.title_tr);
    if (ruleObj.title_bg) patternSources.push(ruleObj.title_bg);
    if (ruleObj.display) patternSources.push(ruleObj.display);

    return glossary.filter(e => {
      const ebg = normalize(e.bg || e.letter || e.pattern || e.form || e.display || "");
      
      // 1. Direct ID match
      if (rid && (e.rule_refs || []).includes(rid)) return true;
      
      // 2. Marker match
      const markers = e.rule_marks || e.markers || [];
      const hasMarkerMatch = rid && (Array.isArray(markers) ? markers : [markers]).some((m: any) => 
        m?.rule_id === rid || m?.type === rid
      );
      if (hasMarkerMatch) return true;
      
      // 3. Pattern match
      return patternSources.some(pattern => {
          if (!pattern) return false;
          const ridClean = normalize(pattern).replace(/[\s/]+/g, '');
          if (ridClean.length >= 2 && ebg.includes(ridClean)) return true;
          
          const parts = normalize(pattern).split(/[\s/]+/).filter(p => p.length >= 2);
          if (parts.some(p => ebg.includes(p))) return true;
          return false;
      });
    }).length;
  }, [glossary, item]);

  if (!item) return null;

  const { type, data, navigation } = item;
 
  // Helper to find context sentences from glossary or lessons
  const findContextSentences = (word: string, glossary?: any[]) => {
    if (!word) return [];
    const searchWord = word.toLowerCase().trim().replace(/[\[\]]/g, '');
    
    let sentences = [];
    if (glossary) {
      sentences = glossary.filter(entry => {
        const bg = (entry.bg || "").toLowerCase().replace(/[\[\]]/g, '');
        // Heuristic for sentence: contains space
        return bg.includes(searchWord) && bg.split(' ').length > 1;
      });
    }

    // If no sentences found
    if (sentences.length === 0) {
      if (searchWord.split(' ').length > 1) {
        // If it's already a phrase, use itself
        return [{ 
          bg: word, 
          tr: item?.data?.tr || item?.data?.meaning_tr || "Kendi başına bir kalıp/cümledir.", 
          meaning_tr: item?.data?.tr 
        }];
      } else {
        // If it's a single word, generate a generic structural example
        return [{
          bg: `Пример: [${word}]`,
          tr: `Örnek: ${item?.data?.tr || 'Kelime'}`,
          meaning_tr: "Sistem tarafından oluşturulan yapısal örnek."
        }];
      }
    }

    return sentences.slice(0, 5); // Limit to top 5
  };

  const contextSentences = type === 'word' 
    ? (data.example_sentences || findContextSentences(data.bg, glossary))
    : [];

  // For letters, we can dynamically find examples if not provided in data
  const letterExamples = type === 'letter' 
    ? (data.examples || (glossary ? getExamplesForLetter(data.print_upper || data.letter, glossary).slice(0, 10) : []))
    : [];

  return (
    <aside className="w-[400px] bg-white border-l border-slate-100 flex flex-col shadow-2xl z-20">
      <div className="p-4 bg-primary-600 text-white flex items-center justify-between sticky top-0 z-10">
        <h3 className="flex items-center gap-2 font-bold text-sm">
          {type === 'rule' ? <Lightbulb size={18} /> : type === 'letter' ? <Book size={18} /> : <Languages size={18} />}
          {type === 'rule' ? 'Kural Detayı' : type === 'letter' ? 'Harf Detayı' : 'Kelime Detayı'}
        </h3>
        <div className="flex items-center gap-1">
          {navigation && (
            <div className="flex items-center bg-black/20 rounded-lg overflow-hidden mr-2">
              <button 
                disabled={navigation.currentIndex === 0}
                onClick={() => {
                  const newIdx = navigation.currentIndex - 1;
                  onSelectItem('word', navigation.list[newIdx], { ...navigation, currentIndex: newIdx });
                }}
                className="p-2 hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-bold px-2 border-x border-white/10">
                {navigation.currentIndex + 1} / {navigation.list.length}
              </span>
              <button 
                disabled={navigation.currentIndex === navigation.list.length - 1}
                onClick={() => {
                  const newIdx = navigation.currentIndex + 1;
                  onSelectItem('word', navigation.list[newIdx], { ...navigation, currentIndex: newIdx });
                }}
                className="p-2 hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* WORD SECTION */}
        {type === 'word' && (
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {data.bg} 
                <span className="text-slate-400 font-medium ml-2 text-lg">({transliterateCyrillic(data.bg)})</span>
              </div>
              <div className="text-lg text-slate-500 font-medium">{data.tr || data.meaning_tr}</div>
              {data.note_tr && <p className="text-sm text-slate-400 italic mt-1">{data.note_tr}</p>}
              {data.analysis && (
                <div className="mt-3 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl text-xs text-indigo-700 leading-relaxed italic">
                  {data.analysis}
                </div>
              )}
            </div>

            {(contextSentences && contextSentences.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bağlamda Kullanım</h4>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Otomatik</span>
                </div>
                <div className="space-y-2">
                  {contextSentences.map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                      <div className="text-sm font-medium text-slate-800 mb-1">
                        <LearningText 
                          bg={ex.bg} 
                          tr={ex.tr} 
                          type="sentence" 
                          detail={{
                            ...ex,
                            // Inject a temporary marker to highlight the target word,
                            // AND preserve any rule markers that were injected into the word.
                            rule_marks: [
                              ...(Array.isArray(ex.rule_marks) ? ex.rule_marks : (ex.rule_marks ? [ex.rule_marks] : [])),
                              ...(Array.isArray(data.rule_marks) ? data.rule_marks : (data.rule_marks ? [data.rule_marks] : [])),
                              ...(Array.isArray(ex.markers) ? ex.markers : (ex.markers ? [ex.markers] : [])),
                              {
                                bg_fragment: data.bg,
                                tr_fragment: data.tr,
                                rule_id: 'target-highlight',
                                color_key: 'indigo',
                                tooltip_tr: 'Seçili Kelime'
                              }
                            ]
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500">{ex.tr || ex.meaning_tr}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RULE OR LETTER CONTEXT */}
        {(type === 'rule' || type === 'letter' || (type === 'word' && navigation?.contextRule)) && (
          <>
            <div className="h-px bg-slate-100" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary-600">
                {type === 'letter' ? <Book size={16} /> : <Lightbulb size={16} />}
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {type === 'letter' ? 'Harf Bilgisi' : 'İlgili Kural'}
                </h4>
              </div>
              <div className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100">
                {type === 'letter' ? (
                  <div className="flex items-center gap-6">
                    <div className="text-5xl font-bold text-primary-700">{data.print_upper || data.letter}</div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">{data.sound_tr || data.name || data.sound} Sesi</div>
                      <div className="text-xs text-slate-500 italic">Transliterasyon: {data.transliteration}</div>
                      <div className="text-xs text-slate-600 mt-2">{data.tr_hint || data.confusion_tr}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-bold text-slate-900 mb-2">
                      {(navigation?.contextRule || data).title_tr || (navigation?.contextRule || data).display}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                      {(navigation?.contextRule || data).explanation_tr || (navigation?.contextRule || data).summary_tr || (typeof (navigation?.contextRule || data).panel_tr === 'object' ? (navigation?.contextRule || data).panel_tr?.summary : (navigation?.contextRule || data).panel_tr)}
                    </p>
                  </>
                )}
                {onSearchRule && (
                  <button 
                    onClick={() => onSearchRule((navigation?.contextRule || data).rule_id || (navigation?.contextRule || data).id || (navigation?.contextRule || data).title_bg || (navigation?.contextRule || data).display)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-white text-primary-700 rounded-lg font-bold text-[10px] uppercase tracking-wider border border-primary-100 hover:bg-primary-100 transition-colors"
                  >
                    <Search size={12} />
                    Tüm Örnekleri Listele {matchCount > 0 && `(${matchCount})`}
                  </button>
                )}
              </div>
            </div>
            
            {/* EXAMPLES LIST */}
            {(type === 'letter' || navigation?.list || data.examples || data.panel_examples) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {type === 'word' ? 'Bu Kurala Uyan Diğer Örnekler' : 'Örnekler'}
                </h4>
                 <div className="space-y-2">
                  {(type === 'letter' ? letterExamples : (navigation?.list || data.examples || data.panel_examples || [])).map((ex: any, i: number) => {
                    const examplesList = type === 'letter' ? letterExamples : (navigation?.list || data.examples || data.panel_examples || []);
                    const isCurrent = type === 'word' && navigation?.currentIndex === i;
                    const contextR = type === 'letter' ? data : (navigation?.contextRule || (type === 'rule' ? data : null));
                    const injectedEx = { ...ex };
                    
                    if (contextR && !injectedEx.rule_marks && !injectedEx.markers) {
                      const markerSource = contextR.marker?.highlight_source || contextR.pattern?.source_fragment || contextR.print_upper;
                      const markerTarget = contextR.marker?.highlight_target || contextR.pattern?.target_fragment || contextR.print_lower;
                      if (markerTarget) {
                        injectedEx.rule_marks = [
                          {
                            bg_fragment: markerTarget,
                            tr_fragment: markerSource,
                            rule_id: contextR.rule_id || contextR.id || contextR.letter_id || 'context-rule',
                            color_key: contextR.marker?.color_key || 'blue',
                            tooltip_tr: contextR.title_tr || contextR.note_tr || 'İlgili Kural'
                          }
                        ];
                      }
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border transition-all ${isCurrent ? 'bg-primary-600 border-primary-600 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-primary-200 cursor-pointer'}`}
                        onClick={() => onSelectItem('word', injectedEx, { ...navigation, list: examplesList, currentIndex: i, contextRule: contextR })}
                      >
                        <div className={`font-bold ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                          {ex.bg_singular 
                            ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <LearningText bg={ex.bg_singular} tr={ex.tr} detail={injectedEx} onSelect={(d) => onSelectItem('word', d, { ...navigation, list: examplesList, currentIndex: i, contextRule: contextR })} className={isCurrent ? 'text-white' : ''} />
                                    <span className={`text-[9px] font-medium opacity-50 ${isCurrent ? 'text-white' : 'text-slate-400'}`}>({transliterateCyrillic(ex.bg_singular)})</span>
                                  </div>
                                  <ChevronRight size={14} className={isCurrent ? 'text-white/50' : 'text-slate-300'} />
                                  <div className="flex flex-col">
                                    <LearningText bg={ex.bg_plural} tr={ex.tr} detail={injectedEx} onSelect={(d) => onSelectItem('word', d, { ...navigation, list: examplesList, currentIndex: i, contextRule: contextR })} className={isCurrent ? 'text-white' : ''} />
                                    <span className={`text-[9px] font-medium opacity-50 ${isCurrent ? 'text-white' : 'text-slate-400'}`}>({transliterateCyrillic(ex.bg_plural)})</span>
                                  </div>
                                </div>
                              )
                            : (
                                <div className="flex items-center gap-2">
                                  <LearningText bg={ex.bg || ex.form} tr={ex.tr} detail={injectedEx} onSelect={(d) => onSelectItem('word', d, { ...navigation, list: examplesList, currentIndex: i, contextRule: contextR })} className={isCurrent ? 'text-white' : ''} />
                                  <span className={`text-[10px] font-medium opacity-50 ${isCurrent ? 'text-white' : 'text-slate-400'}`}>({transliterateCyrillic(ex.bg || ex.form)})</span>
                                </div>
                              )}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isCurrent ? 'text-white/70' : 'text-slate-500'}`}>{ex.tr}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Applied Rules Section for Word View */}
        {type === 'word' && !navigation?.contextRule && (
          <>
            <div className="h-px bg-slate-100" />
            
            {(data.rule_marks || data.markers) && (Array.isArray(data.rule_marks || data.markers) ? (data.rule_marks || data.markers) : [(data.rule_marks || data.markers)]).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uygulanan Kurallar</h4>
                <div className="flex flex-col gap-2">
                  {(Array.isArray(data.rule_marks || data.markers) ? (data.rule_marks || data.markers) : [(data.rule_marks || data.markers)]).map((m: any, idx: number) => {
                    const rData = allRules ? allRules[m.rule_id] : null;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border transition-all ${rData ? 'bg-primary-50/30 border-primary-100 cursor-pointer hover:border-primary-300' : 'bg-slate-50 border-slate-100'}`}
                        onClick={() => {
                          if (rData) onSelectItem('rule', rData);
                        }}
                      >
                         <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            {m.rule_id || m.type}
                          </span>
                          <div className="flex items-center gap-1">
                            {onSearchRule && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onSearchRule(m.rule_id); }}
                                className="p-1 hover:bg-primary-200 rounded text-primary-600 transition-colors"
                                title="Bu kurala uyan tum kelimeleri ara"
                              >
                                <Search size={12} />
                              </button>
                            )}
                            {rData && <ChevronRight size={14} className="text-slate-300" />}
                          </div>
                        </div>
                        <div className="text-xs text-slate-900 font-bold">{m.tooltip_tr || m.display || 'Ses/Harf Dönüşümü'}</div>
                        {rData && <div className="text-[10px] text-slate-400 italic line-clamp-1">{rData.title_tr}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
