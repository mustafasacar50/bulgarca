import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2, Info, Trophy, Type, PenTool, CaseUpper, CaseLower, Eye, EyeOff, XCircle, MessageSquare, Table } from 'lucide-react';
import { Lesson, VocabularyItem } from '../types/lesson';
import { Rule } from '../types/rule';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { Modal } from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonReaderProps {
  lessonId: string;
  onBack: () => void;
}

export function LessonReader({ lessonId, onBack }: LessonReaderProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [selectedItem, setSelectedItem] = useState<{ type: 'rule' | 'word' | 'letter', data: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // UI States
  const [showMarkers, setShowMarkers] = useState(true);
  const [useHandwriting, setUseHandwriting] = useState(false);
  const [useLowercase, setUseLowercase] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const manifestRes = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`);
        const manifest = await manifestRes.json();
        
        const lessonMeta = manifest.lessons.find((l: any) => l.id === lessonId);
        if (!lessonMeta) return;

        const lessonPath = (lessonMeta.path || lessonMeta.filePath).replace(/^\//, '');
        const [lessonRes, ...ruleResponses] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}${lessonPath}`).then(r => {
            if (!r.ok) throw new Error(`Ders dosyası yüklenemedi: ${r.statusText}`);
            return r;
          }),
          ...manifest.rules.map((r: any) => fetch(`${import.meta.env.BASE_URL}${r.filePath.replace(/^\//, '')}`).then(res => {
            if (!res.ok) throw new Error(`Kural dosyası yüklenemedi (${r.title}): ${res.statusText}`);
            return res;
          }))
        ]);

        const lessonData = await lessonRes.json();
        const rulesDataArray = await Promise.all(ruleResponses.map(r => r.json()));
        
        const rulesMap: Record<string, Rule> = {};
        rulesDataArray.forEach(rs => {
          rs.rules.forEach((r: Rule) => {
            rulesMap[r.id] = r;
          });
        });

        setLesson(lessonData);
        setRules(rulesMap);
        if (lessonData.ui_hints?.default_show_marker !== undefined) {
          setShowMarkers(lessonData.ui_hints.default_show_marker);
        }
      } catch (error) {
        console.error('Data loading error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [lessonId]);

  const handleComplete = () => {
    setShowCompleteModal(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!lesson) return <div>Ders bulunamadı.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 py-8">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8">
        <header className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{lesson.title_tr}</h1>
                {lesson.title_bg && <p className="text-sm text-slate-500 font-medium">{lesson.title_bg}</p>}
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
            <button 
              onClick={() => setShowMarkers(!showMarkers)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                showMarkers ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {showMarkers ? <Eye size={16} /> : <EyeOff size={16} />}
              Marker {showMarkers ? 'Açık' : 'Kapalı'}
            </button>

            {lesson.ui_hints?.supports_handwriting_toggle && (
              <>
                <button 
                  onClick={() => setUseHandwriting(!useHandwriting)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    useHandwriting ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {useHandwriting ? <PenTool size={16} /> : <Type size={16} />}
                  {useHandwriting ? 'El Yazısı' : 'Basılı'}
                </button>
                <button 
                  onClick={() => setUseLowercase(!useLowercase)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    useLowercase ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {useLowercase ? <CaseLower size={16} /> : <CaseUpper size={16} />}
                  {useLowercase ? 'Küçük Harf' : 'Büyük Harf'}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="space-y-12">
          {lesson.sections.map((section, sIdx) => (
            <section key={section.section_id || sIdx} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-bold text-slate-800">{section.title_tr}</h2>
              </div>

              <div className="space-y-8">
                {section.blocks.map((block, bIdx) => (
                  <div key={bIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {block.type === 'explanation' && (
                      <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {block.text_tr}
                      </p>
                    )}

                    {(block.type === 'alphabet_grid' || block.type === 'alphabet_grid_v2') && block.items && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {block.items.map((item, i) => {
                          const displayChar = useHandwriting 
                            ? (useLowercase ? item.hand_lower : item.hand_upper)
                            : (useLowercase ? (item.print_lower || item.letter?.split(' ')[1]) : (item.print_upper || item.letter?.split(' ')[0]));
                          
                          return (
                            <div 
                              key={i}
                              onClick={() => setSelectedItem({ type: 'letter', data: item })}
                              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 transition-all hover:shadow-sm cursor-pointer group"
                            >
                              <div className={`text-4xl font-bold text-primary-700 mb-1 ${useHandwriting ? 'font-handwriting' : ''}`}>
                                {displayChar || item.letter}
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium text-slate-500">{item.sound}</div>
                                <div className="text-[10px] text-slate-300 font-mono">{item.latin_hint}</div>
                              </div>
                              <div className="text-[10px] text-slate-400 border-t pt-2 mt-2 italic line-clamp-1 group-hover:line-clamp-none transition-all">
                                {item.note_tr}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(block.type === 'rule_cards' || block.type === 'rule_cards_v2') && block.rules && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {block.rules.map((ruleRef, i) => {
                          const ruleData = rules[ruleRef.rule_id];
                          return (
                            <div 
                              key={i}
                              className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-primary-400 transition-colors cursor-pointer group"
                              onClick={() => setSelectedItem({ type: 'rule', data: ruleData || ruleRef })}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-slate-900 text-lg">{ruleRef.display || ruleData?.title}</h3>
                                <Info size={18} className="text-slate-400 group-hover:text-primary-500" />
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2">{ruleRef.panel_tr || ruleData?.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {block.type === 'plural_rule_cards' && block.items && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {block.items.map((item, i) => (
                          <div 
                            key={i}
                            className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setSelectedItem({ type: 'rule', data: item })}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-black rounded-full uppercase tracking-widest">
                                {item.display}
                              </span>
                            </div>
                            <p className="text-slate-600 text-sm mb-4">{item.explanation_tr}</p>
                            <div className="space-y-2">
                              {item.examples.slice(0, 2).map((ex: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="font-bold text-slate-700">
                                    {ex.bg_singular} → {ex.bg_plural}
                                  </span>
                                  <span className="text-slate-400">{ex.tr}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'word_table_v2' && block.items && (
                      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bulgarca</th>
                              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Çoğul</th>
                              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Türkçe</th>
                              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cinsiyet</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {block.items.map((item, i) => (
                              <tr 
                                key={i} 
                                className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedItem({ type: 'word', data: item })}
                              >
                                <td className="p-4 font-bold text-slate-800">{item.bg}</td>
                                <td className="p-4 text-slate-600">{item.plural}</td>
                                <td className="p-4 text-slate-600">{item.tr}</td>
                                <td className="p-4"><span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{item.gender}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {block.type === 'phrase_cards' && block.items && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {block.items.map((item, i) => (
                          <div 
                            key={i}
                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary-300 transition-all cursor-pointer"
                            onClick={() => setSelectedItem({ type: 'word', data: item })}
                          >
                            <div>
                              <div className="text-lg font-bold text-slate-900">{item.bg}</div>
                              <div className="text-sm text-slate-500">{item.tr}</div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'dialog_cards' && block.items && (
                      <div className="space-y-6">
                        {block.items.map((item, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
                            <div className="flex items-center gap-2 text-primary-600">
                              <MessageSquare size={20} />
                              <h4 className="font-bold">{item.title_tr}</h4>
                            </div>
                            <div className="space-y-4">
                              {item.lines.map((line: any, idx: number) => (
                                <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'items-start' : 'items-end'}`}>
                                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                                    idx % 2 === 0 ? 'bg-white border border-slate-100 rounded-tl-none' : 'bg-primary-600 text-white rounded-tr-none'
                                  }`}>
                                    <div className="font-bold">{line.bg}</div>
                                    <div className={`text-xs mt-1 ${idx % 2 === 0 ? 'text-slate-400' : 'text-white/70'}`}>{line.tr}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'grammar_panel' && (
                      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-900 p-4 text-white font-bold flex items-center gap-2">
                          <Table size={18} />
                          {block.title_tr}
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                              {block.items?.map((item: any, i: number) => (
                                <tr key={i}>
                                  {item.person && <td className="py-3 px-4 font-bold text-slate-400 italic">{item.person}</td>}
                                  {item.form && <td className="py-3 px-4 font-bold text-primary-600">{item.form}</td>}
                                  {item.pattern && <td className="py-3 px-4 font-bold text-slate-800">{item.pattern}</td>}
                                  <td className="py-3 px-4 text-slate-500">{item.tr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {block.type === 'vocabulary' && block.items && (
                      <div className="grid grid-cols-1 gap-4 mt-4">
                        {block.items.map((item, i) => (
                          <div 
                            key={i} 
                            className={`group bg-white p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              selectedItem?.data === item ? 'border-primary-500 shadow-md ring-2 ring-primary-50' : 'border-slate-200 hover:border-primary-300'
                            }`}
                            onClick={() => setSelectedItem({ type: 'word', data: item })}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-900">{item.bg}</span>
                                {item.pronunciation && <span className="text-xs text-slate-400 font-medium">/{item.pronunciation}/</span>}
                              </div>
                              <div className="text-sm text-slate-500">{item.tr}</div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'study_tip' && (
                      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Info size={20} />
                        </div>
                        <p className="text-amber-900 text-sm leading-relaxed italic">{block.text_tr}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="pt-10 flex justify-center">
          <button 
            onClick={handleComplete}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] transition-all"
          >
            <CheckCircle2 size={24} />
            Dersi Tamamla
          </button>
        </div>
      </div>

      {/* Info Panel - Static on Desktop, Drawer on Mobile */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="sticky top-24">
          {selectedItem ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <RightInfoPanelStatic item={selectedItem} onClose={() => setSelectedItem(null)} showMarkers={showMarkers} />
            </div>
          ) : (
            <div className="hidden lg:block border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
              <Info className="mx-auto mb-4 opacity-20" size={48} />
              <p className="text-sm">Kelime veya kural hakkında detaylı bilgi almak için üzerine tıklayın.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Info Panel Wrapper */}
      <div className="lg:hidden">
        <RightInfoPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>

      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Tebrikler!">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Trophy size={48} />
            </motion.div>
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-800">Harika İş Çıkardın!</h4>
            <p className="text-slate-500 leading-relaxed">
              "{lesson.title_tr}" dersini başarıyla tamamladın. Yeni kelimeler ve kurallar öğrenmeye devam et!
            </p>
          </div>
          <button 
            onClick={() => {
              setShowCompleteModal(false);
              onBack();
            }}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
          >
            Ders Listesine Dön
          </button>
        </div>
      </Modal>
    </div>
  );
}

function RightInfoPanelStatic({ item, onClose, showMarkers }: { item: { type: 'rule' | 'word' | 'letter', data: any }, onClose: () => void, showMarkers: boolean }) {
  const { type, data } = item;

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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
        <h3 className="font-bold text-lg">
          {type === 'rule' ? 'Kural Detayı' : type === 'letter' ? 'Harf Detayı' : 'Kelime Detayı'}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <XCircle size={18} />
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        {type === 'letter' && (
          <>
            <div>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-6xl font-bold text-slate-900">{data.print_upper}</div>
                <div className="text-3xl font-medium text-slate-400 mb-1">{data.print_lower}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Latin Karşılık</div>
                  <div className="text-lg font-bold text-slate-700">{data.latin_hint}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ses</div>
                  <div className="text-lg font-bold text-primary-600">{data.sound}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Açıklama</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{data.note_tr}</p>
            </div>

            {data.panel_examples && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnek Kelimeler</h4>
                <div className="flex flex-wrap gap-2">
                  {data.panel_examples.map((ex: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                      {ex}
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
              <div className="text-3xl font-bold text-slate-900 mb-2">{data.title_tr || data.display || data.title}</div>
              <p className="text-slate-600 leading-relaxed">
                {data.explanation_tr || data.summary_tr || data.panel_tr || data.description}
              </p>
            </div>
            
            {(data.examples || data.panel_examples) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnekler</h4>
                <div className="space-y-3">
                  {(data.examples || data.panel_examples).map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-800 text-lg">
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
                      <div className="text-sm text-slate-500">{ex.tr || ex.explanation_tr}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'word' && (
          <>
            <div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{data.bg}</div>
              <div className="text-lg text-primary-600 font-medium">{data.tr}</div>
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
                <div className="text-sm font-medium text-slate-700">{data.plural}</div>
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
    </div>
  );
}
