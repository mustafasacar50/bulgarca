import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2, Info } from 'lucide-react';
import { Lesson, VocabularyItem } from '../types/lesson';
import { Rule } from '../types/rule';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { RuleTooltip } from '../components/RuleTooltip';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

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
    <div className="flex flex-col lg:flex-row gap-8 relative">
      <div className="flex-1 max-w-3xl mx-auto lg:mx-0 space-y-8 pb-20">
        <header className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
              <p className="text-sm text-slate-500">Ders İçeriği</p>
            </div>
          </div>
        </header>

        <div className="space-y-10">
          {lesson.content.map((block, idx) => (
            <section key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              {block.type === 'text' && (
                <p className="text-lg text-slate-700 leading-relaxed">
                  {block.value}
                </p>
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
                          <span className="text-xl font-bold text-slate-900">{item.bg}</span>
                          {item.ruleId && rules[item.ruleId] && (
                            <div onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'rule', data: rules[item.ruleId!] }); }}>
                              <RuleTooltip rule={rules[item.ruleId]}>
                                <Info size={14} className="text-primary-400" />
                              </RuleTooltip>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">{item.tr}</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}
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
              "{lesson.title}" dersini başarıyla tamamladın. Yeni kelimeler ve kurallar öğrenmeye devam et!
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

// Static version of the info panel for desktop
function RightInfoPanelStatic({ item, onClose }: { item: any, onClose: () => void }) {
  const { type, data } = item;
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">{type === 'rule' ? 'Kural Detayı' : 'Kelime Detayı'}</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
      </div>
      <div className="p-6 space-y-6">
        {type === 'word' ? (
          <>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-slate-900">{data.bg}</div>
              <div className="text-lg text-slate-500">{data.tr}</div>
              {data.pronunciation && <div className="text-xs text-primary-500 font-bold">[{data.pronunciation}]</div>}
            </div>
            {data.example && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Örnek</div>
                <div className="font-bold text-slate-800">{data.example}</div>
              </div>
            )}
            {data.note && (
              <div className="text-sm text-slate-600 bg-amber-50 p-4 rounded-2xl border border-amber-100 italic">
                {data.note}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-primary-600">{data.pattern}</div>
            <p className="text-sm text-slate-600 leading-relaxed">{data.description}</p>
          </>
        )}
      </div>
    </div>
  );
}
