import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2, Info, Trophy, Type, PenTool, CaseUpper, CaseLower, Eye, EyeOff, XCircle, MessageSquare, Table, Settings as SettingsIcon, Search } from 'lucide-react';
import { Lesson, VocabularyItem } from '../types/lesson';
import { Rule } from '../types/rule';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { Modal } from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { LearningText } from '../components/LearningText';
import { AppearanceSettings } from '../components/AppearanceSettings';

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
  const [showSettings, setShowSettings] = useState(false);
  const [blockSearch, setBlockSearch] = useState<Record<number, string>>({});

  const { settings } = useDisplaySettings();

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
          ...(manifest.rules || []).map((r: any) => fetch(`${import.meta.env.BASE_URL}${r.filePath.replace(/^\//, '')}`).then(res => {
            if (!res.ok) throw new Error(`Kural dosyası yüklenemedi (${r.title}): ${res.statusText}`);
            return res;
          }))
        ]);

        const lessonData = await lessonRes.json();
        const rulesDataArray = await Promise.all(ruleResponses.map(r => r.json()));
        
        const rulesMap: Record<string, Rule> = {};
        rulesDataArray.forEach(rs => {
          (rs.rules || []).forEach((r: Rule) => {
            rulesMap[r.id] = r;
          });
        });

        setLesson(lessonData);
        setRules(rulesMap);
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
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${showSettings ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <SettingsIcon size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Görünüm</span>
            </button>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-slate-50">
                  <AppearanceSettings />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="space-y-12">
          {(lesson.sections || []).map((section, sIdx) => (
            <section key={section.section_id || sIdx} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-bold text-slate-800">{section.title_tr}</h2>
              </div>

              <div className="space-y-8">
                {(section.blocks || []).map((block, bIdx) => (
                  <div key={bIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {block.type === 'explanation' && (
                      <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {block.text_tr}
                      </p>
                    )}

                    {(block.type === 'alphabet_grid' || block.type === 'alphabet_grid_v2' || block.type === 'alphabet_cards') && (block.items || (block as any).cards) && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(block.items || (block as any).cards || []).map((item: any, i: number) => {
                          const displayChar = settings.scriptMode === "handwriting" 
                            ? (settings.letterCaseMode === "lowercase" ? item.hand_lower : item.hand_upper)
                            : (settings.letterCaseMode === "lowercase" ? (item.print_lower || item.letter?.split(' ')[1]) : (item.print_upper || item.letter?.split(' ')[0]));
                          
                          return (
                            <div 
                              key={i}
                              onClick={() => setSelectedItem({ type: 'letter', data: item })}
                              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 transition-all hover:shadow-sm cursor-pointer group"
                            >
                              <div className={`text-4xl font-bold text-primary-700 mb-1 ${settings.scriptMode === "handwriting" ? 'font-handwriting' : ''}`}>
                                {displayChar || item.letter}
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium text-slate-500">{item.sound}</div>
                                <div className="text-[10px] text-slate-300 font-mono">{item.latin_hint || item.transliteration}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(block.type === 'rule_cards' || block.type === 'rule_cards_v2' || block.type === 'conversion_rule_grid') && (block.rules || block.items || (block as any).conversion_rules) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(block.rules || block.items || (block as any).conversion_rules || []).map((ruleRef: any, i: number) => {
                          const ruleData = rules[ruleRef.rule_id];
                          return (
                            <div 
                              key={i}
                              className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-primary-400 transition-colors cursor-pointer group"
                              onClick={() => setSelectedItem({ type: 'rule', data: ruleData || ruleRef })}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-slate-900 text-lg">{ruleRef.display || ruleData?.title || ruleRef.title_tr}</h3>
                                <Info size={18} className="text-slate-400 group-hover:text-primary-500" />
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2">{ruleRef.explanation_tr || ruleRef.panel_tr || ruleData?.description}</p>
                              {ruleRef.examples && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {(ruleRef.examples || []).slice(0, 3).map((ex: any, idx: number) => (
                                    <LearningText 
                                      key={idx} 
                                      bg={ex.bg} 
                                      tr={ex.tr} 
                                      detail={ex}
                                      onSelect={(data) => setSelectedItem({ type: 'word', data })}
                                      className="px-2 py-1 bg-white text-[10px] font-bold rounded border border-slate-100"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {block.type === 'plural_rule_cards' && block.items && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(block.items || []).map((item, i) => (
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
                              {(item.examples || []).slice(0, 3).map((ex: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <LearningText bg={ex.bg_singular} tr={ex.tr} detail={ex} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                                  <ChevronRight size={12} className="text-slate-300" />
                                  <LearningText bg={ex.bg_plural} tr={ex.tr} detail={ex} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(block.type === 'word_table' || block.type === 'word_table_v2' || block.type === 'grammar_table') && block.items && (
                      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bulgarca</th>
                              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Anlam / Detay</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(block.items || []).map((item: any, i: number) => (
                              <tr 
                                key={i} 
                                className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedItem({ type: 'word', data: item })}
                              >
                                <td className="p-4">
                                  <LearningText bg={item.bg || item.pattern || item.form} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                                </td>
                                <td className="p-4 text-sm text-slate-500">
                                  {item.tr}
                                  {item.gender && <span className="ml-2 text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase">{item.gender}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(block.type === 'phrase_cards' || (block as any).type === 'phrases') && block.items && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(block.items || []).map((item: any, i: number) => (
                          <div 
                            key={i}
                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary-300 transition-all cursor-pointer"
                            onClick={() => setSelectedItem({ type: 'word', data: item })}
                          >
                            <LearningText bg={item.bg} tr={item.tr} detail={item} tooltip_tr={item.note_tr} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                            <ChevronRight size={18} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}

                    {(block.type === 'dialogue' || block.type === 'dialog_cards') && (block.items || (block as any).dialogues) && (
                      <div className="space-y-6">
                        {(block.items || (block as any).dialogues || []).map((item: any, i: number) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
                            <div className="flex items-center gap-2 text-primary-600">
                              <MessageSquare size={20} />
                              <h4 className="font-bold">{item.title_tr}</h4>
                            </div>
                            <div className="space-y-4">
                              {(item.lines || []).map((line: any, idx: number) => (
                                <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'items-start' : 'items-end'}`}>
                                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                                    idx % 2 === 0 ? 'bg-white border border-slate-100 rounded-tl-none' : 'bg-primary-600 text-white rounded-tr-none'
                                  }`}>
                                    <LearningText 
                                      bg={line.bg} 
                                      tr={line.tr} 
                                      detail={line}
                                      onSelect={(data) => setSelectedItem({ type: 'word', data })}
                                      className={idx % 2 !== 0 ? 'text-white' : ''}
                                    />
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
                                  <td className="py-3 px-4">
                                    <LearningText bg={item.form || item.pattern} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                                  </td>
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
                        {(block.items || []).map((item, i) => (
                          <div 
                            key={i} 
                            className={`group bg-white p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              selectedItem?.data === item ? 'border-primary-500 shadow-md ring-2 ring-primary-50' : 'border-slate-200 hover:border-primary-300'
                            }`}
                            onClick={() => setSelectedItem({ type: 'word', data: item })}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                                {item.pronunciation && <span className="text-xs text-slate-400 font-medium">/{item.pronunciation}/</span>}
                              </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}

                    {(block.type === 'glossary_table') && (block.items || block.entries) && (
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text"
                            placeholder="Sözlükte ara (Türkçe veya Bulgarca)..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={blockSearch[bIdx] || ''}
                            onChange={(e) => setBlockSearch({ ...blockSearch, [bIdx]: e.target.value })}
                          />
                        </div>

                        {block.description_tr && (
                          <p className="text-sm text-slate-500 italic px-2">{block.description_tr}</p>
                        )}

                        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Bulgarca</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Türkçe Anlam</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detay</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Kaynak</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {(block.items || block.entries || [])
                                .filter((item: any) => {
                                  const query = (blockSearch[bIdx] || '').toLowerCase();
                                  return !query || 
                                    (item.bg || '').toLowerCase().includes(query) || 
                                    (item.tr || '').toLowerCase().includes(query) ||
                                    (item.entry_id || '').toLowerCase().includes(query);
                                })
                                .map((item: any, i: number) => (
                                <tr 
                                  key={i} 
                                  className="hover:bg-primary-50/30 transition-colors cursor-pointer group"
                                  onClick={() => setSelectedItem({ type: 'word', data: item })}
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} className="font-bold" />
                                      {item.status === 'auto_extracted_needs_review' && (
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase whitespace-nowrap">
                                          Otomatik
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="text-slate-600 text-sm font-medium">{item.tr}</span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                      {(item.markers || item.rules || []).map((m: any, idx: number) => (
                                        <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                                          {m.rule_id || m.type || m || 'Ek'}
                                        </span>
                                      ))}
                                      {item.gender && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded uppercase">{item.gender}</span>}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <span className="text-[10px] font-mono text-slate-300 group-hover:text-slate-500">
                                      S.{item.source_page || item.source?.page || '??'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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

                    {!['explanation', 'alphabet_grid', 'alphabet_grid_v2', 'alphabet_cards', 'rule_cards', 'rule_cards_v2', 'conversion_rule_grid', 'plural_rule_cards', 'word_table', 'word_table_v2', 'grammar_table', 'phrase_cards', 'phrases', 'dialogue', 'dialog_cards', 'grammar_panel', 'vocabulary', 'study_tip', 'glossary_table'].includes(block.type) && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-mono">
                        [DEBUG] Desteklenmeyen blok türü: {block.type}
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

      {/* Info Panel */}
      <div className="lg:w-96 flex-shrink-0">
        <div className="sticky top-24">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div 
                key={selectedItem.data.id || selectedItem.data.entry_id || selectedItem.data.bg || 'panel'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
              <RightInfoPanel 
                item={selectedItem} 
                onClose={() => setSelectedItem(null)} 
                onSelectItem={(type, data) => setSelectedItem({ type, data })}
              />
              </motion.div>
            ) : (
              <div className="hidden lg:block border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                <Info className="mx-auto mb-4 opacity-20" size={48} />
                <p className="text-sm">Kelime veya kural hakkında detaylı bilgi almak için üzerine tıklayın.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
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
