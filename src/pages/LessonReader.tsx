import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2, Info, Trophy } from 'lucide-react';
import { Lesson, VocabularyItem } from '../types/lesson';
import { Rule } from '../types/rule';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';

interface LessonReaderProps {
  lessonId: string;
  onBack: () => void;
}

export function LessonReader({ lessonId, onBack }: LessonReaderProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [selectedItem, setSelectedItem] = useState<{ type: 'rule' | 'word', data: Rule | VocabularyItem } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

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
        <header className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{lesson.title_tr}</h1>
              {lesson.title_bg && <p className="text-sm text-slate-500 font-medium">{lesson.title_bg}</p>}
            </div>
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

                    {block.type === 'alphabet_grid' && block.items && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {block.items.map((item, i) => (
                          <div 
                            key={i}
                            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 transition-all hover:shadow-sm"
                          >
                            <div className="text-2xl font-bold text-primary-700 mb-1">{item.letter}</div>
                            <div className="text-sm font-medium text-slate-500 mb-2">{item.sound}</div>
                            <div className="text-xs text-slate-400 border-t pt-2 mt-2 italic">{item.note_tr}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'rule_cards' && block.rules && (
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
                                <h3 className="font-bold text-slate-900 text-lg">{ruleRef.display}</h3>
                                <Info size={18} className="text-slate-400 group-hover:text-primary-500" />
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2">{ruleRef.panel_tr}</p>
                            </div>
                          );
                        })}
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
              <RightInfoPanelStatic item={selectedItem} onClose={() => setSelectedItem(null)} />
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

function RightInfoPanelStatic({ item, onClose }: { item: { type: 'rule' | 'word', data: any }, onClose: () => void }) {
  const { type, data } = item;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
        <h3 className="font-bold text-lg">{type === 'rule' ? 'Kural Detayı' : 'Kelime Detayı'}</h3>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <Info size={18} />
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        {type === 'rule' ? (
          <>
            <div>
              <div className="text-3xl font-bold text-slate-900 mb-2">{data.title_tr || data.display}</div>
              <p className="text-slate-600 leading-relaxed">
                {data.summary_tr || data.panel_tr}
              </p>
            </div>
            
            {data.examples && data.examples.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Örnekler</h4>
                <div className="space-y-2">
                  {data.examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-800">{typeof ex === 'string' ? ex : ex.bg}</div>
                      {ex.tr && <div className="text-sm text-slate-500">{ex.tr}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
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
