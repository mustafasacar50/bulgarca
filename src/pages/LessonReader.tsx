import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2, Info, Trophy, PenTool, Eye, MessageSquare, Settings as SettingsIcon, Search, AlertCircle } from 'lucide-react';
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
  const [lesson, setLesson] = useState<any | null>(null);
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [selectedItem, setSelectedItem] = useState<{ type: 'rule' | 'word' | 'letter', data: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");

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
            if (!r.ok) throw new Error("Ders dosyasi yuklenemedi");
            return r;
          }),
          ...(manifest.rules || []).map((r: any) => fetch(`${import.meta.env.BASE_URL}${r.filePath.replace(/^\//, '')}`).then(res => {
            if (!res.ok) throw new Error("Kural dosyasi yuklenemedi");
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

  const normalize = (text: string) => text.toLocaleLowerCase('tr-TR').trim();

  const renderBlock = (block: any, bIdx: number) => {
    const type = (block.type || "").toString().trim();
    const items = block.items || block.table_rows || block.rules || block.lines || block.entries || block.prompts || block.content_blocks || [];
    
    if (lessonSearch) {
      const q = normalize(lessonSearch);
      const matches = items.some((item: any) => {
        const bg = (item.bg || item.letter || item.pattern || item.form || item.display || "").toString();
        const tr = (item.tr || item.meaning_tr || item.explanation_tr || item.note_tr || item.title_tr || "").toString();
        return normalize(bg).includes(q) || normalize(tr).includes(q);
      });
      if (!matches && !normalize(block.title_tr || "").includes(q)) return null;
    }

    switch (type) {
      case "explanation":
      case "text":
        return (
          <div className="space-y-4">
            {block.text_tr && <p className="text-slate-600 leading-relaxed">{block.text_tr}</p>}
            {block.body_tr && <p className="text-slate-600 leading-relaxed">{block.body_tr}</p>}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((it: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:border-primary-200 transition-colors cursor-pointer" onClick={() => setSelectedItem({ type: 'word', data: it })}>
                    <LearningText bg={it.bg} tr={it.tr} detail={it} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                    {it.detail_tr && <span className="text-xs text-slate-400 italic">{it.detail_tr}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "alphabet_grid":
      case "alphabet_grid_v2":
      case "alphabet_cards":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item: any, i: number) => {
              const displayChar = settings.scriptMode === 'handwriting' 
                ? (settings.letterCaseMode === 'uppercase' ? item.hand_upper : item.hand_lower)
                : (settings.letterCaseMode === 'uppercase' ? item.print_upper : item.print_lower);
              
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
        );

      case "rule_cards":
      case "rule_cards_v2":
      case "conversion_rule_grid":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((ruleRef: any, i: number) => {
              const ruleId = typeof ruleRef === 'string' ? ruleRef : ruleRef.rule_id;
              const ruleData = rules[ruleId];
              const displayData = typeof ruleRef === 'string' ? ruleData : ruleRef;
              if (!displayData) return null;

              return (
                <div 
                  key={i}
                  className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-primary-400 transition-colors cursor-pointer group"
                  onClick={() => setSelectedItem({ type: 'rule', data: ruleData || displayData })}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900 text-lg">{displayData.display || displayData.title_tr || displayData.title || displayData.display_tr}</h3>
                    <Info size={18} className="text-slate-400 group-hover:text-primary-500" />
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{displayData.explanation_tr || displayData.summary_tr || displayData.description_tr}</p>
                  {displayData.examples && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(displayData.examples || []).slice(0, 3).map((ex: any, idx: number) => (
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
        );

      case "grammar_table":
      case "word_table":
      case "word_table_v2":
        return (
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bulgarca</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Anlam / Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item: any, i: number) => (
                  <tr 
                    key={i} 
                    className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem({ type: 'word', data: item })}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.person && <span className="text-[10px] font-black text-slate-300 uppercase italic w-12">{item.person}</span>}
                        <LearningText bg={item.bg || item.pattern || item.form} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {item.tr || item.meaning_tr}
                      {item.gender && <span className="ml-2 text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase">{item.gender}</span>}
                      {item.note_tr && <span className="ml-2 text-[10px] text-slate-300 italic">({item.note_tr})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "phrase_cards":
      case "phrases":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item: any, i: number) => (
              <div 
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary-300 transition-all cursor-pointer group"
                onClick={() => setSelectedItem({ type: 'word', data: item })}
              >
                <div className="flex flex-col">
                  <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} className="font-bold text-lg" />
                  {item.note_tr && <span className="text-xs text-slate-400 mt-1">{item.note_tr}</span>}
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-primary-500 transition-colors" />
              </div>
            ))}
          </div>
        );

      case "dialogue":
      case "dialog_cards":
        return (
          <div className="space-y-6">
            {(block.items || block.dialogues || [block]).map((item: any, i: number) => (
              <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
                {item.title_tr && (
                  <div className="flex items-center gap-2 text-primary-600 mb-2">
                    <MessageSquare size={20} />
                    <h4 className="font-bold">{item.title_tr}</h4>
                  </div>
                )}
                <div className="space-y-4">
                  {(item.lines || []).map((line: any, idx: number) => (
                    <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-2 mb-1 px-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{line.speaker}</span>
                      </div>
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
        );

      case "writing_template":
      case "writing_practice":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((it: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-100 hover:border-primary-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 rounded-xl flex items-center justify-center transition-colors">
                    <PenTool size={20} />
                  </div>
                  {it.title_tr && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{it.title_tr}</span>}
                </div>
                <div className="space-y-3">
                   <div className="text-xs text-slate-400 font-medium">{it.tr}</div>
                   <div className={`text-2xl font-bold text-slate-900 ${settings.scriptMode === 'handwriting' ? 'font-handwriting' : ''}`}>
                      {it.bg}
                   </div>
                   <div className="h-10 w-full bg-slate-50 rounded-lg border border-slate-100 mt-4 border-dashed"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case "visual_card_reference":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((it: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group text-center" onClick={() => setSelectedItem({ type: 'word', data: it })}>
                <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-slate-200 group-hover:bg-primary-50 transition-colors">
                  <Eye size={32} />
                </div>
                <div className="font-bold text-slate-900">{it.bg}</div>
                <div className="text-xs text-slate-400">{it.tr}</div>
              </div>
            ))}
          </div>
        );

      case "vocabulary":
        return (
          <div className="grid grid-cols-1 gap-4 mt-4">
            {items.map((item: any, i: number) => (
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
        );

      case "glossary_table":
        return (
          <div className="space-y-4">
            {block.description_tr && (
              <p className="text-sm text-slate-500 italic px-2">{block.description_tr}</p>
            )}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Bulgarca</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Turkce Anlam</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detay</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Kaynak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item: any, i: number) => (
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
        );

      case "study_tip":
        return (
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info size={20} />
            </div>
            <p className="text-amber-900 text-sm leading-relaxed italic">{block.text_tr || block.body_tr}</p>
          </div>
        );

      default:
        return (
          <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600">
            <AlertCircle size={24} />
            <div className="text-sm">
              <div className="font-bold">Bilinmeyen Bolum Tipi</div>
              <div className="opacity-70 font-mono text-[10px]">{type}</div>
            </div>
          </div>
        );
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!lesson) return <div>Ders bulunamadi.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 py-8">
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
              <span className="text-xs font-bold uppercase tracking-wider">Gorunum</span>
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Ders icinde ara..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700"
              value={lessonSearch}
              onChange={(e) => setLessonSearch(e.target.value)}
            />
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
          {lesson.sections.map((section: any, sIdx: number) => {
            const sectionBlocks = section.blocks || [section];
            const renderedBlocks = sectionBlocks.map((block: any, bIdx: number) => renderBlock(block, bIdx)).filter(Boolean);
            
            if (renderedBlocks.length === 0) return null;

            return (
              <section key={sIdx} className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <h2 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">{section.title_tr}</h2>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <div className="space-y-8">
                  {renderedBlocks.map((rendered: any, rbIdx: number) => (
                    <div key={rbIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${rbIdx * 100}ms` }}>
                      {rendered}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
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
                <p className="text-sm">Kelime veya kural hakkinda detayli bilgi almak icin uzerine tiklayin.</p>
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
              <Trophy size={40} />
            </motion.div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Harika Is!</h3>
            <p className="text-slate-500 text-sm mt-1">"{lesson.title_tr}" dersini basariyla bitirdin.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full pt-4">
             <div className="bg-slate-50 p-4 rounded-2xl">
                <div className="text-2xl font-bold text-slate-900">100%</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tamamlama</div>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl">
                <div className="text-2xl font-bold text-slate-900">A1</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Seviye</div>
             </div>
          </div>
          <button 
            onClick={onBack}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-4"
          >
            Ders Listesine Don
          </button>
        </div>
      </Modal>
    </div>
  );
}
