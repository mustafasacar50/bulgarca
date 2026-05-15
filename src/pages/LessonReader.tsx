import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Search, 
  X, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  Trophy, 
  AlertCircle,
  MessageSquare,
  PenTool,
  Eye,
  ChevronDown,
  Languages,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { Rule } from '../types/rule';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { Modal } from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { useAuth } from '../state/AuthContext';
import { getGithubFile, saveJsonToGithub } from '../engine/githubSync';
import { LearningText } from '../components/LearningText';
import { AppearanceSettings } from '../components/AppearanceSettings';
import { findPairMarkers } from '../engine/ruleMatcher';
import { transliterateCyrillic } from '../utils/textFormat';

interface LessonReaderProps {
  lessonId: string;
  onBack: () => void;
}

export function LessonReader({ lessonId, onBack }: LessonReaderProps) {
  const [lesson, setLesson] = useState<any | null>(null);
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [glossary, setGlossary] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ 
    type: 'rule' | 'word' | 'letter', 
    data: any,
    navigation?: {
      list: any[],
      currentIndex: number,
      contextRule?: any
    }
  } | null>(null);
  const [quizBank, setQuizBank] = useState<any>(null);
  const [showAdminQuizModal, setShowAdminQuizModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const { user, isAdmin } = useAuth();
  const { settings, updateSettings } = useDisplaySettings();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isRev = settings.isReversed;
  // Helper: returns the "secondary" text column based on direction
  const secText = (item: any) => isRev ? (item.bg || '') : (item.tr || '');
  // Helper: returns the "primary" text based on direction  
  const priText = (item: any) => isRev ? (item.tr || '') : (item.bg || '');
  // Helper: returns title/description in current direction
  const t = (obj: any, field: string = 'title') => {
    if (!obj) return '';
    if (isRev) return obj[`${field}_bg`] || obj[`${field}_tr`] || '';
    return obj[`${field}_tr`] || '';
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const manifestRes = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`);
        const manifest = await manifestRes.json();
        
        // Fetch User Progress from GitHub
        if (user?.token) {
          try {
            const progRes = await getGithubFile({
              token: user.token,
              owner: 'mustafasacar50',
              repo: 'bulgarca-user-data',
              path: `users/${user.username}/progress.json`,
              branch: 'main'
            });
            if (progRes?.content) {
              const completed = progRes.content.completedLessons || [];
              setIsCompleted(completed.includes(lessonId));
            }
          } catch (e) { /* ignore missing progress file */ }
        }

        const lessonMeta = manifest.lessons.find((l: any) => l.id === lessonId);
        if (!lessonMeta) return;

        // Fetch Quiz Bank if linked
        if (lessonMeta.quiz_bank) {
          fetch(`${import.meta.env.BASE_URL}${lessonMeta.quiz_bank}`)
            .then(r => r.json())
            .then(setQuizBank)
            .catch(e => console.error("Quiz bank load error:", e));
        }

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
        
        // Load Glossaries
        try {
          const glossaryResponses = await Promise.all(
            (manifest.glossaries || []).map((path: string) => 
              fetch(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
            )
          );
          const combinedGlossary = glossaryResponses
            .filter(Boolean)
            .flatMap((g: any) => g.entries || g.items || (Array.isArray(g) ? g : []));
          setGlossary(combinedGlossary);
        } catch (e) {
          console.warn("Glossary loading failed, continuing without it.");
        }

        const rulesMap: Record<string, Rule> = {};
        rulesDataArray.forEach((rs, idx) => {
          const fPath = manifest.rules[idx].filePath;
          (rs.rules || []).forEach((r: Rule) => {
            const rid = r.id || r.rule_id;
            if (rid) rulesMap[rid] = { ...r, filePath: fPath } as any;
          });
        });

        setLesson(lessonData);
        setRules(rulesMap);
        document.title = `${lessonData.title_tr} | Bulgarca A1`;
      } catch (error) {
        console.error('Data loading error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [lessonId]);

  const handleToggleComplete = async () => {
    if (!user?.token) return;
    
    setIsSyncing(true);
    const newState = !isCompleted;
    setIsCompleted(newState);
    
    try {
      // 1. Get current progress
      let currentProgress: { completedLessons: string[] } = { completedLessons: [] };
      try {
        const res = await getGithubFile({
          token: user.token,
          owner: 'mustafasacar50',
          repo: 'bulgarca-user-data',
          path: `users/${user.username}/progress.json`,
          branch: 'main'
        });
        if (res?.content) currentProgress = res.content;
      } catch (e) { /* ignore */ }

      // 2. Update list
      let list = currentProgress.completedLessons || [];
      if (newState) {
        if (!list.includes(lessonId)) list.push(lessonId);
      } else {
        list = list.filter((id: string) => id !== lessonId);
      }

      // 3. Save back
      await saveJsonToGithub({
        token: user.token,
        owner: 'mustafasacar50',
        repo: 'bulgarca-user-data',
        branch: 'main'
      }, `users/${user.username}/progress.json`, { ...currentProgress, completedLessons: list }, `${newState ? 'Complete' : 'Re-review'} lesson ${lessonId}`);
      
      if (newState) setShowCompleteModal(true);
    } catch (e) {
      console.error("Progress save error:", e);
      alert("İlerleme kaydedilemedi.");
      setIsCompleted(!newState); // Rollback
    } finally {
      setIsSyncing(false);
    }
  };

  const normalize = (text: any) => {
    if (!text || typeof text !== 'string') return "";
    let t = text.toLocaleLowerCase('tr-TR').trim();
    // Script normalization: Map Latin look-alikes to Cyrillic counterparts
    // common in Bulgarian data when typed on mixed keyboards
    const scriptMap: Record<string, string> = {
      'a': 'а', 'o': 'о', 'e': 'е', 'p': 'р', 'x': 'х', 'y': 'у', 'c': 'с', 't': 'т'
    };
    return t.split('').map(char => scriptMap[char] || char).join('');
  };

  // Search Results Flattening
   const searchResults = useMemo(() => {
    if (!lessonSearch && !selectedRuleId) return [];
    if (!lesson) return [];
    
    const q = lessonSearch ? normalize(lessonSearch) : "";
    const allItems: any[] = [];
    const seen = new Set<string>();
    const allRulesArray = Object.values(rules);

    let activeRuleObj: any = rules[selectedRuleId || ""];
    if (!activeRuleObj && selectedRuleId) {
      // Search in lesson blocks if not in global rules
      const allLessonBlocks = (lesson.sections || []).flatMap((s: any) => s.blocks || [s]);
      const ruleInLesson = allLessonBlocks.flatMap((b: any) => b.rules || []).find((r: any) => r.rule_id === selectedRuleId);
      if (ruleInLesson) activeRuleObj = ruleInLesson;
    }

    const addItem = (item: any, blockType: string = 'unknown', sourceLabel: string = '', sourceType: string = 'lesson') => {
      if (!item || typeof item !== 'object') return;
      const bg = (item.bg || item.letter || item.pattern || item.form || item.display || "").toString();
      const tr = (item.tr || item.meaning_tr || item.explanation_tr || item.note_tr || item.title_tr || "").toString();
      if (!bg && !tr) return;

      const id = item.entry_id || `${bg}_${tr}`;
      if (seen.has(id)) return;

      const searchMatch = !q || (normalize(bg).includes(q) || normalize(tr).includes(q));
      let markers = item.rule_marks;
      let ruleMatch = !selectedRuleId;

      if (selectedRuleId) {
        // 1. Direct ID match
        if ((item.rule_refs || []).includes(selectedRuleId)) {
          ruleMatch = true;
        } else {
          // 2. Marker match (ID or Type)
          if (!markers) {
            markers = findPairMarkers({ 
              tr: item.tr || item.meaning_tr, 
              bg: item.bg || item.pattern || item.form, 
              ruleRefs: item.rule_refs, 
              rules: allRulesArray 
            });
          }
          const hasMarkerMatch = (markers || []).some((m: any) => 
            m.rule_id === selectedRuleId || 
            m.type === selectedRuleId ||
            (m.bg_fragment && selectedRuleId.includes(m.bg_fragment))
          );
          
          if (hasMarkerMatch) {
            ruleMatch = true;
          } else {
            // 3. Smart Context Match (Global Scanning)
            // Restricted to Bulgarian text only for grammar patterns
            const bgClean = normalize(bg);

            // a. Scan for highlight target (e.g. "не", "ли") as a WHOLE WORD
            const target = activeRuleObj.marker?.highlight_target;
            if (target) {
              const normTarget = normalize(target);
              // Regex for whole word in Cyrillic/Latin: 
              // Matches if surrounded by non-alphanumeric chars or at start/end
              const regex = new RegExp(`(^|[^a-zа-я])(${normTarget})([^a-zа-я]|$)`, 'i');
              if (regex.test(bgClean)) {
                ruleMatch = true;
              }
            } 
            
            // b. Fallback to pattern matching (only if rule has a specific pattern)
            if (!ruleMatch && activeRuleObj.pattern) {
              const parts = normalize(activeRuleObj.pattern).split(/[\s/]+/).filter(p => p.length >= 2);
              if (parts.some(p => bgClean.includes(p))) ruleMatch = true;
            }
          }
        }
      }

      if (searchMatch && ruleMatch) {
        seen.add(id);
        
        // 4. Resolve Markers (Explicit + Detected)
        let resolvedMarkers = markers;
        if (!resolvedMarkers) {
          resolvedMarkers = findPairMarkers({ 
            tr: item.tr || item.meaning_tr, 
            bg: item.bg || item.pattern || item.form, 
            ruleRefs: item.rule_refs, 
            rules: allRulesArray 
          });
        }

        // Add "Virtual Marker" for highlighting if matched via smart context
        if (selectedRuleId && activeRuleObj && !resolvedMarkers.some((m: any) => m.rule_id === selectedRuleId)) {
          const target = activeRuleObj.marker?.highlight_target || activeRuleObj.pattern;
          if (target && typeof target === 'string') {
            resolvedMarkers = [...resolvedMarkers, {
              rule_id: selectedRuleId,
              bg_fragment: target,
              color_key: activeRuleObj.marker?.color_key || 'amber',
              is_detected: true,
              score: 5
            }];
          }
        }

        allItems.push({ 
          ...item, 
          rule_marks: resolvedMarkers, 
          _parentBlockType: blockType,
          _sourceLabel: sourceLabel,
          _sourceType: sourceType
        });
      }
    };
    
    // 1. Process Lesson Sections
    const lessonSections = lesson.sections || [{ blocks: lesson.blocks || [] }];
    for (const section of lessonSections) {
      const sectionLabel = section.title_tr || lesson.title_tr || 'Ders';
      const blocks = section.blocks || [section];
      for (const block of blocks) {
        const items = block.items || block.table_rows || block.rows || block.rules || block.rule_ids || block.lines || block.entries || block.prompts || block.content_blocks || [];
        for (const item of items) {
          addItem(item, block.type, sectionLabel, 'lesson');
          if (allItems.length >= 500) break;
        }
        if (allItems.length >= 500) break;
      }
      if (allItems.length >= 500) break;
    }

    // 2. Process Glossary (if limit not reached)
    if (allItems.length < 500) {
      for (const item of glossary) {
        addItem(item, 'glossary', 'Sözlük', 'glossary');
        if (allItems.length >= 500) break;
      }
    }

    return allItems;
  }, [lessonSearch, selectedRuleId, lesson, rules, glossary]);

  const renderBlock = (block: any, bIdx: number) => {
    const type = (block.type || "").toString().trim();
    let rawItems = block.items || block.cards || block.table_rows || block.rows || block.rules || block.rule_ids || block.lines || block.entries || block.prompts || block.content_blocks || [];
    
    // Enrich items with markers
    const items = rawItems.map((it: any) => {
       if (!it || typeof it !== 'object') return it;
       if (it.rule_marks) return it;
       const markers = findPairMarkers({
         tr: it.tr || it.meaning_tr,
         bg: it.bg || it.pattern || it.form,
         ruleRefs: it.rule_refs,
         rules: Object.values(rules)
       });
       if (markers.length > 0) return { ...it, rule_marks: markers };
       return it;
    });

    switch (type) {
      case "explanation":
      case "text":
        return (
          <div className="space-y-4">
            {block.title_tr && <h3 className="font-bold text-slate-800">{t(block)}</h3>}
            {block.text_tr && <p className="text-slate-600 leading-relaxed">{block.text_tr}</p>}
            {block.body_tr && <p className="text-slate-600 leading-relaxed">{block.body_tr}</p>}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((it: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:border-primary-200 transition-colors cursor-pointer" onClick={() => setSelectedItem({ 
                    type: 'word', 
                    data: it,
                    navigation: { list: items, currentIndex: i, contextRule: block } // Pass block as the rule context
                  })}>
                    <LearningText bg={it.bg} tr={it.tr} detail={it} onSelect={(data) => setSelectedItem({ 
                      type: 'word', 
                      data,
                      navigation: { list: items, currentIndex: i, contextRule: block }
                    })} />
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

      case "rule_cards_v2":
        return (
          <div className="grid grid-cols-1 gap-4">
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
                </div>
              );
            })}
          </div>
        );

      case "grammar_table":
        const gHeaders = block.headers || block.headers_tr;
        const gRows = block.rows || block.table_rows;
        if (gHeaders && gRows) {
          return (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {gHeaders.map((h: string, i: number) => (
                      <th key={i} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gRows.map((row: string[], i: number) => (
                    <tr 
                      key={i} 
                      className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                      onClick={() => {
                        const bgCombined = row.slice(0, row.length - 1).join(" ↔ ");
                        const trCombined = row[row.length - 1];
                        setSelectedItem({
                          type: 'word',
                          data: {
                            bg: bgCombined,
                            tr: trCombined,
                            note_tr: `Karşılaştırma Detayı:\n${gHeaders.map((h: string, idx: number) => `${h}: ${row[idx]}`).join('\n')}`
                          }
                        });
                      }}
                    >
                      {row.map((cell: string, j: number) => (
                        <td key={j} className="p-4 text-sm font-medium text-slate-800">
                          {j === 0 || j === 1 ? <LearningText bg={cell} tr="" onSelect={() => {}} /> : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // Fallthrough if it uses the legacy items format
      case "word_table":
        return (
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-50">
                {items.map((item: any, i: number) => (
                  <tr 
                    key={i} 
                    className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem({ 
                      type: 'word', 
                      data: item,
                      navigation: { list: items, currentIndex: i }
                    })}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.person && <span className="text-[10px] font-black text-slate-300 uppercase italic w-12">{item.person}</span>}
                        <LearningText bg={item.bg || item.pattern || item.form} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ 
                          type: 'word', 
                          data,
                          navigation: { list: items, currentIndex: i }
                        })} />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {item.tr || item.meaning_tr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "phrases":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item: any, i: number) => (
              <div 
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary-300 transition-all cursor-pointer group"
                onClick={() => setSelectedItem({ 
                  type: 'word', 
                  data: item,
                  navigation: { list: items, currentIndex: i }
                })}
              >
                <div className="flex flex-col">
                  <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ 
                    type: 'word', 
                    data,
                    navigation: { list: items, currentIndex: i }
                  })} className="font-bold text-lg" />
                  {item.note_tr && <span className="text-xs text-slate-400 mt-1">{item.note_tr}</span>}
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-primary-500 transition-colors" />
              </div>
            ))}
          </div>
        );

      case "source_sentence_reader":
        return <SourceSentenceReader key={bIdx} block={block} onSelectItem={setSelectedItem} glossary={glossary} rules={rules} />;

      case "rule_grouped_word_table":
        const groupedRules = block.rules || [];
        const targetRules = groupedRules.length > 0 ? groupedRules : Object.keys(rules);
        return (
          <div className="space-y-6">
            {targetRules.map((rId: string) => {
              const rule = rules[rId];
              const matches = glossary.filter(e => (e.rule_refs || []).includes(rId));
              if (matches.length === 0) return null;
              return (
                <div key={rId} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{rule?.title_tr || rId}</h4>
                      <p className="text-xs text-slate-500">{rule?.short_tr || rule?.description_tr}</p>
                    </div>
                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400">{matches.length} KELİME</span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-slate-50">
                      {matches.slice(0, 10).map((item, i) => (
                        <tr key={i} className="hover:bg-primary-50/30 transition-colors cursor-pointer" onClick={() => setSelectedItem({ type: 'word', data: item })}>
                          <td className="p-3 w-1/2">
                            <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ type: 'word', data })} className="font-bold" />
                          </td>
                          <td className="p-3 w-1/2 text-sm text-slate-500">{secText(item)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {matches.length > 10 && (
                    <button 
                      onClick={() => { setSelectedRuleId(rId); setLessonSearch(""); }}
                      className="w-full p-3 text-center text-[10px] font-bold text-primary-500 hover:bg-primary-50 transition-colors border-t border-slate-50"
                    >
                      TÜMÜNÜ GÖR ({matches.length})
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "pronunciation_drill":
        return (
          <div className="grid grid-cols-1 gap-3">
            {(block.items || []).map((item: any, i: number) => (
              <div 
                key={i} 
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-primary-300 transition-all cursor-pointer group flex items-center justify-between"
                onClick={() => setSelectedItem({ type: 'word', data: item })}
              >
                <div>
                  <div className="text-2xl font-black text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">{priText(item)}</div>
                  <div className="text-sm font-medium text-slate-500">{secText(item)}</div>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all">
                  <ChevronRight size={24} />
                </div>
              </div>
            ))}
          </div>
        );

      case "rule_group_summary":
        const targetFile = block.rule_file_path;
        const filteredRules = Object.values(rules).filter((r: any) => !targetFile || r.filePath?.includes(targetFile));
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRules.map((rule: any) => {
              const count = glossary.filter(e => (e.rule_refs || []).includes(rule.rule_id)).length;
              if (count === 0 && !block.show_empty) return null;
              return (
                <button 
                  key={rule.rule_id}
                  onClick={() => { setSelectedRuleId(rule.rule_id); setLessonSearch(""); }}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-primary-400 transition-all text-left flex justify-between items-center group"
                >
                  <div className="pr-4">
                    <div className="text-sm font-bold text-slate-800 group-hover:text-primary-600">{rule.title_tr}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{rule.category}</div>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-xl text-center min-w-[50px] border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100">
                    <div className="text-sm font-black text-slate-700 group-hover:text-primary-700">{count}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Kelime</div>
                  </div>
                </button>
              );
            })}
          </div>
        );


      case "dialogue_scenes":
        return (
          <div className="space-y-8">
            {(block.scenes || []).map((scene: any, sIdx: number) => (
              <div key={sIdx} className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary-500" />
                  {scene.title_tr}
                </h4>
                <div className="space-y-1 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  {(scene.lines || []).map((line: any, lIdx: number) => (
                    <div 
                      key={lIdx} 
                      className="group flex gap-4 p-4 hover:bg-primary-50/50 transition-colors cursor-pointer border-b last:border-0 border-slate-50"
                      onClick={() => setSelectedItem({ 
                        type: 'word', 
                        data: line,
                        navigation: { list: scene.lines, currentIndex: lIdx, contextRule: scene }
                      })}
                    >
                      <div className="w-24 flex-shrink-0 text-[10px] font-black text-slate-400 uppercase tracking-tighter pt-1">
                        {line.speaker}
                      </div>
                      <div className="flex-1 space-y-1">
                        <LearningText bg={line.bg} tr={line.tr} detail={line} onSelect={(data) => setSelectedItem({ 
                          type: 'word', 
                          data,
                          navigation: { list: scene.lines, currentIndex: lIdx, contextRule: scene }
                        })} className="font-medium text-slate-900" />
                        <div className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">{line.tr}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "dialogue_practice":
        const dpTasks = block.tasks || block.items || [];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dpTasks.map((task: any, tIdx: number) => (
              <div 
                key={tIdx} 
                className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl hover:border-indigo-300 transition-colors cursor-pointer group"
                onClick={() => setSelectedItem({ 
                  type: 'word', 
                  data: { 
                    bg: task.model_bg || (task.target_patterns && task.target_patterns[0]) || "Ornek cozum...", 
                    tr: task.model_tr || task.prompt_tr, 
                    note_tr: task.prompt_tr,
                    analysis: task.target_patterns?.join(" | ")
                  }
                })}
              >
                <div className="flex items-center gap-2 text-indigo-600 mb-3">
                  <PenTool size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Rol Çalışması</span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-2">{task.prompt_tr}</p>
                <div className="text-xs text-slate-500 italic group-hover:text-slate-700">Tıkla ve örnek çözümü gör</div>
              </div>
            ))}
          </div>
        );

      case "phrase_cards":
        return (
          <div className="grid grid-cols-1 gap-4">
            {(block.cards || block.items || []).map((card: any, i: number) => (
              <div 
                key={i} 
                className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-primary-400 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                onClick={() => setSelectedItem({ type: 'word', data: card })}
              >
                <div className="flex-1 space-y-1">
                  <div className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">
                    <LearningText bg={card.bg} tr={card.tr} detail={card} className="tracking-tight" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                    Tıkla ve detayları gör
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-6">
                  <div className="text-lg font-medium text-slate-500 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:text-primary-700 transition-all">
                    {secText(card)}
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-90 transition-all duration-500">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "reverse_transcription_drill":
        return <ReverseTranscriptionDrill key={bIdx} block={block} glossary={glossary} onSelectItem={setSelectedItem} />;

      case "reverse_transcription_input":
        return <ReverseTranscriptionInput key={bIdx} block={block} onSelectItem={setSelectedItem} />;

      case "bidirectional_dictionary_table":
        return <BidirectionalDictionaryTable key={bIdx} block={block} onSelectItem={setSelectedItem} />;

      case "abbreviation_table":
      case "phrase_table":
      case "time_greeting_chart":
      case "transformation_table":
      case "pronoun_case_table":
        return <DynamicDataTable key={bIdx} block={block} onSelectItem={setSelectedItem} />;

      case "grammar_feature_cards":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(block.cards || block.items || []).map((card: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-primary-400 transition-all cursor-pointer group" onClick={() => setSelectedItem({ type: 'word', data: card })}>
                <div className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-600">{card.title_bg || card.bg}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{card.description_tr || card.tr}</div>
                {card.examples && (
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                    {(card.examples || []).slice(0, 2).map((ex: any, ei: number) => (
                      <div key={ei} className="text-xs">
                        <span className="font-bold text-slate-700">{ex.bg}</span>
                        <span className="text-slate-400 ml-2">{secText(ex)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case "flashcard_grid":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(block.cards || block.items || []).map((card: any, i: number) => (
              <div 
                key={i} 
                className="aspect-square bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:border-primary-500 hover:shadow-xl hover:shadow-primary-100 transition-all cursor-pointer group"
                onClick={() => setSelectedItem({ type: 'word', data: card })}
              >
                <div className="text-3xl mb-3 group-hover:scale-125 transition-transform">{card.emoji || '??'}</div>
                <div className="text-lg font-black text-slate-900 group-hover:text-primary-600">{card.bg}</div>
                <div className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{secText(card)}</div>
              </div>
            ))}
          </div>
        );

      case "annotated_sentence_examples":
        return (
          <div className="space-y-4">
            {(block.sentences || block.items || []).map((item: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedItem({ type: 'word', data: item })}>
                <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(d) => setSelectedItem({ type: 'word', data: d })} className="text-xl font-medium block" />
                <div className="mt-2 text-sm text-slate-500">{secText(item)}</div>
                {item.analysis && <p className="mt-3 text-[11px] text-slate-400 border-l-2 border-primary-200 pl-3 italic">{item.analysis}</p>}
              </div>
            ))}
          </div>
        );

      case "direction_toggle_lookup":
        return (
          <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t(block)}</h3>
              <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold">INTERAKTIF SZLK</div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{block.description_tr}</p>
            <div className="flex gap-4">
               <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black mb-1">BG</div>
                  <div className="text-[10px] text-slate-500 uppercase">Giris</div>
               </div>
               <div className="flex items-center text-primary-500">
                  <RefreshCw size={24} />
               </div>
               <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black mb-1">TR</div>
                  <div className="text-[10px] text-slate-500 uppercase">Cikis</div>
               </div>
            </div>
          </div>
        );

      case "plural_rule_cards":
        return (
          <div className="grid grid-cols-1 gap-6">
            {(block.items || []).map((rule: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-primary-400 transition-all">
                <div className="text-xl font-black text-primary-600 mb-2 font-mono bg-primary-50 inline-block px-3 py-1 rounded-lg">{rule.display}</div>
                <div className="text-sm text-slate-600 mb-4">{rule.explanation_tr}</div>
                <div className="space-y-2">
                  {(rule.examples || []).map((ex: any, ei: number) => (
                    <div 
                      key={ei} 
                      className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer group/ex"
                      onClick={() => setSelectedItem({ type: 'word', data: { bg: ex.bg_plural, tr: ex.tr, note_tr: rule.explanation_tr }})}
                    >
                      <div>
                        <span className="text-slate-400 line-through mr-2">{ex.bg_singular}</span>
                        <span className="font-bold text-slate-900 group-hover/ex:text-primary-600">
                          <LearningText bg={ex.bg_plural} tr={ex.tr} detail={ex} onSelect={(d) => setSelectedItem({ type: 'word', data: d })} />
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs">{secText(ex)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "word_table_v2":
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">{isRev ? 'Türkçe' : 'Български'}</th>
                    <th className="p-4">{isRev ? 'Български' : 'Türkçe'}</th>
                    <th className="p-4">Rod</th>
                    <th className="p-4">Çoğul</th>
                    <th className="p-4">Notlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(block.items || []).map((item: any, i: number) => (
                    <tr 
                      key={i} 
                      className="hover:bg-primary-50/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedItem({ type: 'word', data: item })}
                    >
                      <td className="p-4 font-bold text-slate-900 group-hover:text-primary-600">
                         <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(d) => setSelectedItem({ type: 'word', data: d })} />
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{secText(item)}</td>
                      <td className="p-4"><span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-500 rounded uppercase">{item.gender}</span></td>
                      <td className="p-4 text-sm text-slate-700 font-bold">{item.plural}</td>
                      <td className="p-4 text-xs text-slate-400 italic">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "glossary_table":
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {block.title_tr && (
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 mb-1">{t(block)}</h3>
                {block.description_tr && <p className="text-sm text-slate-500">{block.description_tr}</p>}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">{isRev ? 'Türkçe' : 'Български'}</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">{isRev ? 'Български' : 'Türkçe'}</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Kaynak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(block.entries || []).map((entry: any, i: number) => (
                    <tr 
                      key={i} 
                      className="hover:bg-primary-50/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedItem({ type: 'word', data: entry })}
                    >
                      <td className="p-4 font-bold text-slate-900 group-hover:text-primary-600">
                        <LearningText bg={entry.bg} tr={entry.tr} detail={entry} onSelect={(d) => setSelectedItem({ type: 'word', data: d })} />
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{secText(entry)}</td>
                      <td className="p-4 text-right text-xs text-slate-300 font-mono">S.{entry.source?.page || '?'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "rule_cards":
      case "conversion_rule_grid":
        return (
          <div className="space-y-6">
            {block.title_tr && (
              <div className="flex items-center gap-3 ml-2">
                <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t(block)}</h3>
              </div>
            )}
            <div className="grid grid-cols-1 gap-5">
              {(block.rule_ids || []).map((rid: string, i: number) => {
                const rule = rules[rid];
                if (!rule) return null;
                
                // Enhanced matching logic
                const ruleExamples = rule.examples || [];
                const glossaryMatches = glossary.filter(e => 
                  (e.rule_refs || []).includes(rid) || 
                  (e.markers || []).some((m: any) => m.rule_id === rid || m.rule_id === rid.replace('cog-tr-', 'cognate_').replace('-to-bg-', '_to_'))
                );
                
                const displayExamples = glossaryMatches.length > 0 ? glossaryMatches.slice(0, 2) : ruleExamples.slice(0, 2);
                const totalCount = Math.max(glossaryMatches.length, ruleExamples.length);

                return (
                  <div 
                    key={i} 
                    className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-primary-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-base font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                        {rule.title_tr || rid}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        {totalCount} ÖRNEK
                      </div>
                    </div>

                    {displayExamples.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {displayExamples.map((m: any, mi: number) => (
                          <div 
                            key={mi} 
                            className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-primary-100 transition-all cursor-pointer group/ex"
                            onClick={() => setSelectedItem({ 
                              type: 'word', 
                              data: m,
                              navigation: {
                                list: displayExamples,
                                currentIndex: mi,
                                contextRule: rule
                              }
                            })}
                          >
                             <div className="flex flex-col">
                               <LearningText bg={m.bg || m.bg_singular} tr={m.tr} detail={m} className="font-bold text-slate-900 text-xs" />
                             </div>
                             <div className="text-[10px] font-medium text-slate-400">{secText(m)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => setSelectedRuleId(rid)}
                      className="text-primary-500 hover:text-primary-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors pl-1"
                    >
                      Tümünü Gör 
                      <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );


      case "quiz":
        return <QuizBlock key={bIdx} block={block} lesson={lesson} />;

      case "study_tip":
        return (
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info size={20} />
            </div>
            <p className="text-amber-900 text-sm leading-relaxed italic">{block.text_tr || block.body_tr}</p>
          </div>
        );

      case "visual_card_reference":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item: any, i: number) => (
              <div 
                key={i}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:border-primary-300 transition-all cursor-pointer group"
                onClick={() => setSelectedItem({ 
                  type: 'word', 
                  data: item,
                  navigation: { list: items, currentIndex: i }
                })}
              >
                <div className="aspect-square bg-slate-100 flex items-center justify-center p-8">
                  <span className="text-6xl group-hover:scale-110 transition-transform">{item.emoji || '📦'}</span>
                </div>
                <div className="p-4 text-center">
                  <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ 
                    type: 'word', 
                    data,
                    navigation: { list: items, currentIndex: i }
                  })} className="font-bold text-xl block mb-1" />
                  <div className="text-sm text-slate-500 font-medium">{secText(item)}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case "writing_template":
      case "writing_practice":
        return (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <PenTool size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{block.title_tr || 'Yazma Pratiği'}</h3>
                <p className="text-sm text-slate-500">Bulgarca harf ve kelime yazım kuralları</p>
              </div>
            </div>
            <div className="space-y-4">
              {items.map((item: any, i: number) => (
                <WritingPracticeItem 
                  key={i} 
                  item={item} 
                  onSelect={() => setSelectedItem({ type: 'word', data: item })}
                />
              ))}
            </div>
          </div>
        );

      case "dialogue":
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {block.title_tr && (
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 mb-1">{t(block)}</h3>
                {block.description_tr && <p className="text-sm text-slate-500">{block.description_tr}</p>}
              </div>
            )}
            <div className="p-6 space-y-4">
              {(block.lines || block.items || []).map((line: any, i: number) => (
                <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">{line.speaker}</div>
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl cursor-pointer group transition-all ${
                      i % 2 === 0 
                        ? 'bg-slate-100 hover:bg-slate-200 rounded-tl-sm text-left' 
                        : 'bg-primary-50 hover:bg-primary-100 rounded-tr-sm text-right'
                    }`}
                    onClick={() => setSelectedItem({ type: 'word', data: line })}
                  >
                    <div className="text-lg font-bold text-slate-900 group-hover:text-primary-700">
                      <LearningText bg={line.bg} tr={line.tr} detail={line} onSelect={(d) => setSelectedItem({ type: 'word', data: d })} />
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{line.tr}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!lesson) return <div>Ders bulunamadi.</div>;

  return (
    <div className="relative">
      {/* STICKY TOP BANNER */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={onBack} 
              className="group flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <ArrowLeft size={16} className="text-primary-400 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-bold text-sm tracking-wide">{isRev ? 'Уроци' : 'Dersler'}</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
            <div className="flex flex-col justify-center min-w-0">
              {lessonId.includes('lesson-016') ? (
                <span className="text-[9px] font-black text-rose-500 bg-rose-50 w-fit px-1.5 py-0.5 rounded uppercase tracking-widest leading-none mb-1">
                  {isRev ? 'РЕЧНИК' : 'SÖZLÜK'}
                </span>
              ) : (
                <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest leading-none mb-1">
                  {lessonId.startsWith('lesson-') ? (isRev ? `УРОК ${parseInt(lessonId.split('-')[1])}` : `DERS ${parseInt(lessonId.split('-')[1])}`) : (isRev ? 'СПЕЦИАЛЕН' : 'ÖZEL DERS')}
                </span>
              )}
              <span className="text-sm font-bold text-slate-800 truncate leading-none">
                {t(lesson)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateSettings({ isReversed: !settings.isReversed })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border ${settings.isReversed ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'}`}
              title={settings.isReversed ? "Şu an: Türkçe ➝ Bulgarca (Tıklayıp tersine çevir)" : "Şu an: Bulgarca ➝ Türkçe (Tıklayıp tersine çevir)"}
            >
              <ArrowLeftRight size={16} />
              <span className="hidden sm:block leading-none pt-0.5">{settings.isReversed ? 'TR ➝ BG' : 'BG ➝ TR'}</span>
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${showSettings ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <SettingsIcon size={16} />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block leading-none pt-0.5">{isRev ? 'Изглед' : 'Görünüm'}</span>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-50 border-t border-slate-200/50 shadow-inner relative z-50"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 relative">
                <AppearanceSettings />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 py-8">
        <div className="flex-1 space-y-8">
          <header className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={isRev ? "Търсене в урока..." : "Ders icinde ara..."}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700"
              value={lessonSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLessonSearch(val);
                if (val.trim()) {
                  setSelectedRuleId(null);
                }
              }}
            />
          </div>

          {selectedRuleId && (
            <div className="flex items-center gap-2 px-2">
              <div className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl border border-primary-100 flex items-center gap-2">
                <div className="text-[10px] font-black uppercase tracking-wider">Kural Filtresi:</div>
                <div className="text-sm font-bold">{rules[selectedRuleId]?.title_tr || selectedRuleId}</div>
                <button 
                  onClick={() => setSelectedRuleId(null)}
                  className="p-1 hover:bg-primary-200 rounded-lg text-primary-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

        </header>

        <div className="space-y-12">
          {(lessonSearch || selectedRuleId) ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <h2 className="text-xs font-black text-primary-500 uppercase tracking-[0.2em] whitespace-nowrap">Arama Sonuclari ({searchResults.length})</h2>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                {selectedRuleId && (
                  <button 
                    onClick={() => setSelectedRuleId(null)}
                    className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all"
                  >
                    <ArrowLeft size={12} />
                    LİSTEYE GERİ DÖN
                  </button>
                )}
              </div>
              
              {searchResults.length > 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">{isRev ? 'Turkce' : 'Bulgarca'}</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">{isRev ? 'Bulgarca' : 'Turkce Anlam'}</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detay</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Kaynak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {searchResults.map((item: any, i: number) => (
                        <tr 
                          key={i} 
                          className="hover:bg-primary-50/30 transition-colors cursor-pointer group"
                          onClick={() => setSelectedItem({ 
                            type: 'word', 
                            data: item,
                            navigation: { list: searchResults, currentIndex: i }
                          })}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <LearningText bg={item.bg || item.letter || item.pattern || item.form} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ 
                                type: 'word', 
                                data,
                                navigation: { list: searchResults, currentIndex: i }
                              })} className="font-bold" />
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-800 text-sm font-semibold">{isRev ? (item.bg || item.letter || item.pattern || item.form || '') : (item.tr || item.meaning_tr || '')}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {(item.rule_marks || item.markers || item.rules || []).map((m: any, idx: number) => (
                                <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                                  {m.rule_id || m.type || m || 'Ek'}
                                </span>
                              ))}
                              {item.gender && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded uppercase">{item.gender}</span>}
                              {item.sound && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-500 rounded uppercase">{item.sound}</span>}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                item._sourceType === 'glossary' ? 'bg-slate-100 text-slate-500' : 'bg-primary-50 text-primary-600'
                              }`}>
                                {item._sourceLabel || (item._sourceType === 'glossary' ? 'SÖZLÜK' : 'DERS')}
                              </span>
                              {(item.source_page || item.source?.page) && (
                                <span className="text-[9px] font-mono text-slate-300 mt-1">
                                  S.{item.source_page || item.source?.page}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <Search size={48} className="mx-auto mb-4 opacity-10" />
                  <p>Aradiginiz kelime bulunamadi.</p>
                </div>
              )}
            </section>
          ) : (
            (lesson.sections || [{ blocks: lesson.blocks || [] }]).map((section: any, sIdx: number) => {
              const sectionBlocks = section.blocks || [section];
              const renderedBlocks = sectionBlocks.map((block: any, bIdx: number) => renderBlock(block, bIdx)).filter(Boolean);
              
              if (renderedBlocks.length === 0) return null;

              return (
                <section key={sIdx} className="space-y-6 pt-8 first:pt-0">
                  {section.title_tr && (
                    <div className="relative pl-5 py-1 mb-8">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)]"></div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">{t(section)}</h2>
                      {t(section, 'description') && (
                        <p className="text-base font-medium text-slate-500 mt-2">{t(section, 'description')}</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-10">
                    {renderedBlocks.map((rendered: any, rbIdx: number) => (
                      <div key={rbIdx}>
                        {rendered}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <div className="pt-10 flex justify-center">
          <button 
            onClick={handleToggleComplete}
            disabled={isSyncing || !user?.token}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-lg transition-all ${
              isCompleted 
                ? 'bg-amber-50 text-amber-600 border border-amber-200 shadow-amber-100 hover:bg-amber-100' 
                : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
            } disabled:opacity-50`}
          >
            {isSyncing ? (
              <RefreshCw size={24} className="animate-spin" />
            ) : isCompleted ? (
              <RefreshCw size={24} />
            ) : (
              <CheckCircle2 size={24} />
            )}
            {isSyncing ? 'Senkronize ediliyor...' : isCompleted ? 'Yeniden İncele' : 'Dersi Tamamla'}
          </button>
        </div>
        {isAdmin && quizBank && (
          <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                Soru Bankası Kontrolü (Yönetici)
              </h4>
              <p className="text-xs text-slate-400 mt-1">Bu ders için {quizBank.questions?.length || 0} hazır soru bulunmaktadır.</p>
            </div>
            <button 
              onClick={() => setShowAdminQuizModal(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
            >
              Tüm Soruları Gör
            </button>
          </div>
        )}
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
                onSelectItem={(type, data, navigation) => {
                  setSelectedItem({ type, data, navigation });
                }}
                onSearchRule={(ruleId) => {
                  setLessonSearch("");
                  setSelectedRuleId(ruleId);
                  setSelectedItem(null);
                }}
                allRules={rules}
                glossary={glossary}
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

      <Modal isOpen={showAdminQuizModal} onClose={() => setShowAdminQuizModal(false)} title="Soru Bankası (Tüm Sorular)">
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {(quizBank?.questions || []).map((q: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soru {i+1} ({q.type})</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.correctAnswer}</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{q.prompt}</p>
              {q.options && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {q.options.map((opt: string, oi: number) => (
                    <span key={oi} className={`text-[10px] px-2 py-1 rounded border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {opt}
                    </span>
                  ))}
                </div>
              )}
              {q.explanation_tr && <p className="text-[10px] text-slate-500 italic">💡 {q.explanation_tr}</p>}
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Tebrikler!">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <Trophy size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Harika Is!</h3>
            <p className="text-slate-500 text-sm mt-1">"{lesson.title_tr}" dersini basariyla bitirdin.</p>
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
    </div>
  );
}

/**
 * SOURCE SENTENCE READER COMPONENT
 */
function SourceSentenceReader({ block, onSelectItem, glossary, rules }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(block.reading_file_path)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, [block.reading_file_path]);

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 uppercase text-[10px] font-bold">Kaynak Metin Yukleniyor...</div>;
  if (!data) return <div className="p-10 text-center text-rose-400">Kaynak metin yuklenemedi.</div>;

  return (
    <div className="space-y-4">
      {block.title_tr && <h3 className="font-bold text-slate-700 px-2">{block.title_tr}</h3>}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50">
          {(data.units || []).map((unit: any, i: number) => (
            <div 
              key={i} 
              className="p-6 hover:bg-primary-50/30 transition-colors cursor-pointer group"
              onClick={() => onSelectItem({ type: 'word', data: unit, navigation: { list: data.units, currentIndex: i } })}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">SAYFA {unit.source?.page || '??'} | {unit.unit_id}</span>
              </div>
              <LearningText bg={unit.text} tr={unit.tooltip_tr} detail={unit} onSelect={(d) => onSelectItem({ type: 'word', data: d })} className="text-lg font-medium text-slate-800 leading-relaxed block" />
              <div className="mt-3 text-xs text-slate-400 italic group-hover:text-slate-600 transition-colors">{unit.tooltip_tr}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ENHANCED GLOSSARY TABLE SECTION
 */
function GlossaryTableSection({ block, glossary, rules, setSelectedItem, setSelectedRuleId, setLessonSearch }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [latinSearchTerm, setLatinSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const { settings } = useDisplaySettings();
  const isRev = settings.isReversed;
  const secText = (item: any) => isRev ? (item.bg || '') : (item.tr || '');

  const filtered = glossary.filter((item: any) => {
    const pageNum = (item.source?.page || item.source_page || "").toString();
    const bgTransliterated = transliterateCyrillic(item.bg || "").toLowerCase();
    
    const matchesSearch = !searchTerm || 
      item.bg?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.tr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pageNum === searchTerm ||
      `s.${pageNum}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLatin = !latinSearchTerm || 
      bgTransliterated.includes(latinSearchTerm.toLowerCase());
    
    const matchesLetter = !selectedLetter || (item.bg && item.bg.charAt(0).toUpperCase() === selectedLetter);
    const matchesPage = !selectedPage || pageNum === selectedPage;
    
    return matchesSearch && matchesLatin && matchesLetter && matchesPage;
  });

  const letters = block.letter_summary || [];
  const uniquePages = useMemo(() => {
    const pages = new Set<string>();
    glossary.forEach((item: any) => {
      const p = item.source?.page || item.source_page;
      if (p) pages.add(p.toString());
    });
    return Array.from(pages).sort((a, b) => parseInt(a) - parseInt(b));
  }, [glossary]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="relative md:col-span-6 group">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors cursor-pointer" 
              size={18} 
              onClick={() => document.getElementById('dict-search-normal')?.focus()}
            />
            <input 
              id="dict-search-normal"
              type="text"
              placeholder="Sözlükte ara (TR/BG)..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative md:col-span-6 group">
            <Languages 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors cursor-pointer" 
              size={18} 
              onClick={() => document.getElementById('dict-search-latin')?.focus()}
            />
            <input 
              id="dict-search-latin"
              type="text"
              placeholder="Latin harf ile oku/ara (örn: lap...)"
              className="w-full pl-12 pr-4 py-3 bg-white border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium placeholder:text-indigo-300"
              value={latinSearchTerm}
              onChange={(e) => setLatinSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {letters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/50">
            {letters.map((l: any) => (
              <button
                key={l.letter}
                onClick={() => setSelectedLetter(selectedLetter === l.letter ? null : l.letter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                  selectedLetter === l.letter 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                }`}
              >
                {l.letter}
                <span className={`ml-1 opacity-50 ${selectedLetter === l.letter ? 'text-white' : 'text-slate-400'}`}>({l.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">{isRev ? 'Turkce' : 'Bulgarca'}</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">{isRev ? 'Bulgarca' : 'Turkce Anlam'}</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detay</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Kaynak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item: any, i: number) => (
              <tr 
                key={i} 
                className="hover:bg-primary-50/30 transition-colors cursor-pointer group"
                onClick={() => setSelectedItem({ 
                  type: 'word', 
                  data: item,
                  navigation: { list: filtered, currentIndex: i }
                })}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <LearningText bg={item.bg} tr={item.tr} detail={item} onSelect={(data) => setSelectedItem({ 
                      type: 'word', 
                      data,
                      navigation: { list: filtered, currentIndex: i }
                    })} className="font-bold" />
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-slate-600 text-sm font-medium">{secText(item)}</span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(item.rule_marks || item.markers || item.rules || []).map((m: any, idx: number) => (
                      <span 
                        key={idx} 
                        className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase cursor-help hover:bg-primary-100 hover:text-primary-600 transition-colors"
                        title={m.tooltip_tr}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rData = rules[m.rule_id];
                          if (rData) setSelectedItem({ type: 'rule', data: rData });
                        }}
                      >
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
        {filtered.length === 0 && (
          <div className="p-20 text-center text-slate-300 italic text-sm">
            Filtreye uygun kelime bulunamadi.
          </div>
        )}
      </div>
    </div>
  );
}

function QuizBlock({ block, lesson }: { block: any, lesson?: any }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [bank, setBank] = useState<any>(null);

  useEffect(() => {
    if (lesson?.quiz_bank) {
      fetch(`${import.meta.env.BASE_URL}${lesson.quiz_bank}`)
        .then(r => r.json())
        .then(setBank)
        .catch(console.error);
    }
  }, [lesson?.quiz_bank]);

  const questions = useMemo(() => {
    const raw = (bank?.questions || block.questions || []);
    if (raw.length === 0) return [];
    // Pick 4 random
    return [...raw].sort(() => Math.random() - 0.5).slice(0, 4);
  }, [bank, block.questions]);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handleSelect = (ans: any) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(ans);
    
    let correct = false;
    const correctVal = currentQ.correctAnswer;
    const correctIdx = currentQ.correct_idx !== undefined ? currentQ.correct_idx : currentQ.answer_idx;

    if (typeof ans === 'number') {
      correct = (ans === correctIdx) || (currentQ.options?.[ans] === correctVal);
    } else {
      correct = ans.toLowerCase().trim() === correctVal.toLowerCase().trim();
    }
    
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(s => s + 1);
        setSelectedOpt(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="bg-primary-600 rounded-3xl p-8 text-center text-white space-y-4">
        <Trophy className="mx-auto mb-4" size={48} />
        <h3 className="text-2xl font-bold">Quiz Tamamlandı!</h3>
        <p className="text-primary-100">Başarı Oranı: %{Math.round((score / questions.length) * 100)}</p>
        <div className="text-4xl font-black">{score} / {questions.length}</div>
        <button 
          onClick={() => {
            setCurrentIdx(0);
            setSelectedOpt(null);
            setIsCorrect(null);
            setScore(0);
            setShowResult(false);
          }}
          className="mt-4 px-6 py-2 bg-white text-primary-600 rounded-xl font-bold"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mini Test</span>
        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">Soru {currentIdx + 1} / {questions.length}</span>
      </div>

      <h3 className="text-xl font-bold text-slate-800 leading-relaxed">
        {currentQ.question_tr || currentQ.question}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {(currentQ.options || []).map((opt: string, i: number) => {
          let stateClass = "border-slate-100 hover:border-primary-300";
          const correctIdx = currentQ.correct_idx !== undefined ? currentQ.correct_idx : currentQ.answer_idx;
          
          if (selectedOpt === i) {
            stateClass = isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700";
          } else if (selectedOpt !== null && i === correctIdx) {
            stateClass = "border-emerald-500 bg-emerald-50 text-emerald-700";
          }

          return (
            <button
              key={i}
              disabled={selectedOpt !== null}
              onClick={() => handleSelect(i)}
              className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all flex justify-between items-center ${stateClass}`}
            >
              <span>{opt}</span>
              {selectedOpt === i && (
                isCorrect ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />
              )}
              {selectedOpt !== null && i === correctIdx && i !== selectedOpt && (
                <CheckCircle2 size={20} className="text-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * BIDIRECTIONAL DICTIONARY TABLE COMPONENT
 */
function BidirectionalDictionaryTable({ block, onSelectItem }: any) {
  const [direction, setDirection] = useState(block.direction_default || 'bg_to_tr');
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const filtered = (block.entries || []).filter((e: any) => {
    const s = search.toLowerCase();
    return (e.bg || "").toLowerCase().includes(s) || (e.tr || "").toLowerCase().includes(s);
  });

  const handleToggle = () => setDirection((d: string) => d === 'bg_to_tr' ? 'tr_to_bg' : 'bg_to_tr');

  // Keyboard navigation for direction toggle (Left/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        handleToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6" ref={tableRef}>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Kelime ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button 
          onClick={handleToggle}
          className="flex items-center gap-3 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all group shrink-0"
        >
          <div className={`flex items-center gap-2 transition-all ${direction === 'tr_to_bg' ? 'flex-row-reverse' : ''}`}>
             <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">BG</span>
             <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
             <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">TR</span>
          </div>
          <span className="text-[10px] ml-2 uppercase tracking-widest font-black">{direction === 'bg_to_tr' ? 'BUL -> TR' : 'TR -> BUL'}</span>
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">
                {direction === 'bg_to_tr' ? 'BULGARCA' : 'TRKE'}
              </th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">
                {direction === 'bg_to_tr' ? 'TRKE' : 'BULGARCA'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item: any, i: number) => (
              <tr 
                key={i} 
                className="hover:bg-primary-50/50 transition-colors cursor-pointer group"
                onClick={() => onSelectItem({ type: 'word', data: item, navigation: { list: filtered, currentIndex: i } })}
              >
                <td className="p-4">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary-400 transition-colors"></div>
                      <LearningText 
                        bg={direction === 'bg_to_tr' ? item.bg : item.tr} 
                        tr={direction === 'bg_to_tr' ? item.tr : item.bg} 
                        detail={item} 
                        onSelect={(d) => onSelectItem({ type: 'word', data: d })}
                        className="font-bold text-slate-900"
                      />
                   </div>
                </td>
                <td className="p-4">
                   <LearningText 
                      bg={direction === 'bg_to_tr' ? item.tr : item.bg} 
                      tr={direction === 'bg_to_tr' ? item.bg : item.tr} 
                      detail={item} 
                      onSelect={(d) => onSelectItem({ type: 'word', data: d })}
                      className="text-slate-500 font-medium"
                    />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center text-slate-300 italic text-sm">Aradnz kelime bulunamad.</div>
        )}
      </div>
    </div>
  );
}

/**
 * DYNAMIC DATA TABLE COMPONENT
 * Handles various table types with dynamic columns
 */
function DynamicDataTable({ block, onSelectItem }: any) {
  const rows = block.rows || block.items || [];
  if (rows.length === 0) return null;

  const firstRow = rows[0] || {};
  const columns = Object.keys(firstRow).filter(k => k !== 'entry_id' && k !== 'source' && k !== 'panel_tr' && k !== 'tooltip_tr');
  
  const getColLabel = (key: string) => {
    const labels: any = {
      bg: 'BULGARCA',
      tr: 'TRKE',
      meaning_tr: 'ANLAM',
      gender: 'CNS',
      number: 'SAYI',
      form_bg: 'FORM',
      abbr_bg: 'KISALTM.',
      vocative_bg: 'HTAP',
      formal_bg: 'RESM',
      colloquial_bg: 'SAMM',
      nom_bg: 'NOM.',
      acc_full_bg: 'ACC. (T)',
      acc_short_bg: 'ACC. (K)',
      dat_full_bg: 'DAT. (T)',
      dat_short_bg: 'DAT. (K)',
      person: 'AHIS'
    };
    return labels[key] || key.replace('_bg', '').replace('_tr', '').toUpperCase();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
      {block.title_tr && (
        <div className="bg-slate-50 p-4 border-b border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm">{block.title_tr}</h4>
        </div>
      )}
      <table className="w-full text-left border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            {columns.map(col => (
              <th key={col} className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{getColLabel(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row: any, i: number) => (
            <tr 
              key={i} 
              className="hover:bg-primary-50/30 transition-colors cursor-pointer"
              onClick={() => onSelectItem({ type: 'word', data: row, navigation: { list: rows, currentIndex: i } })}
            >
              {columns.map(col => (
                <td key={col} className="p-4 text-sm">
                  {col.endsWith('_bg') || col === 'bg' ? (
                    <LearningText 
                      bg={row[col]} 
                      tr={row.tr || row.meaning_tr} 
                      detail={row} 
                      onSelect={(d) => onSelectItem({ type: 'word', data: d })}
                      className="font-bold text-slate-800"
                    />
                  ) : (
                    <span className="text-slate-500">{row[col]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
/**
 * REVERSE TRANSCRIPTION DRILL COMPONENT
 */
function ReverseTranscriptionDrill({ block, glossary, onSelectItem }: any) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState('bg_to_tr');

  const items = useMemo(() => {
    if (block.entry_ids && glossary.length > 0) {
      return block.entry_ids.map((id: string) => glossary.find((e: any) => e.entry_id === id)).filter(Boolean);
    }
    return block.items || [];
  }, [block, glossary]);

  if (items.length === 0) return null;
  const current = items[currentIdx];

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIdx((prev) => (prev + 1) % items.length);
  };

  const handleToggle = () => setDirection(d => d === 'bg_to_tr' ? 'tr_to_bg' : 'bg_to_tr');

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <RefreshCw size={120} />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h3 className="text-xl font-bold tracking-tight">{block.title_tr}</h3>
             <p className="text-xs text-slate-400">{block.description_tr}</p>
          </div>
          <button onClick={handleToggle} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
             {direction === 'bg_to_tr' ? 'BG -> TR' : 'TR -> BG'}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-12 space-y-8">
           <div className="text-center space-y-4">
              <div className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">SORU</div>
              <div className="text-5xl font-black tracking-tight">
                {direction === 'bg_to_tr' ? current.bg : current.tr}
              </div>
           </div>

           <AnimatePresence mode="wait">
             {showAnswer ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="text-center space-y-4"
               >
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">CEVAP</div>
                  <div className="text-4xl font-bold text-emerald-50">
                    {direction === 'bg_to_tr' ? current.tr : current.bg}
                  </div>
                  {current.tr_meaning && (
                    <div className="text-sm text-slate-400 italic">Anlam: {current.tr_meaning}</div>
                  )}
               </motion.div>
             ) : (
               <button 
                 onClick={() => setShowAnswer(true)}
                 className="px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl font-bold transition-all shadow-xl shadow-primary-900/20"
               >
                 Cevabı Gör
               </button>
             )}
           </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/10">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KART {currentIdx + 1} / {items.length}</div>
           <div className="flex gap-2">
              <button 
                onClick={() => onSelectItem({ type: 'word', data: current })}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <Info size={18} />
              </button>
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all"
              >
                SIRADAKİ <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

/**
 * REVERSE TRANSCRIPTION INPUT COMPONENT
 */
function ReverseTranscriptionInput({ block, onSelectItem }: any) {
  const [val, setVal] = useState("");
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const check = () => {
     if (val.toLowerCase().trim() === block.target?.toLowerCase().trim()) {
       setStatus('correct');
     } else {
       setStatus('wrong');
       setTimeout(() => setStatus('idle'), 1000);
     }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
       <div className="text-center space-y-2">
          <h4 className="text-lg font-bold text-slate-800">{block.title_tr}</h4>
          <p className="text-3xl font-black text-primary-600">{block.bg}</p>
       </div>
       
       <div className="relative">
          <input 
            type="text" 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            placeholder="Türkçe harflerle yazılışı girin..."
            className={`w-full p-5 bg-slate-50 rounded-2xl border-2 outline-none transition-all font-bold text-xl text-center ${
              status === 'correct' ? 'border-emerald-500 bg-emerald-50' : 
              status === 'wrong' ? 'border-rose-500 bg-rose-50 animate-shake' : 
              'border-transparent focus:border-primary-500'
            }`}
          />
          {status === 'correct' && <CheckCircle2 size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
       </div>

       <button 
         onClick={check}
         className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
       >
         Kontrol Et
       </button>
    </div>
  );
}

/**
 * WRITING PRACTICE ITEM COMPONENT
 */
function WritingPracticeItem({ item, onSelect }: { item: any, onSelect?: () => void }) {
  const [val, setVal] = useState("");
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'typo'>('idle');

  const getLevenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[b.length][a.length];
  };

  const toCyrillic = (text: string) => {
    let t = text.toLowerCase().trim();
    const map: any = {
      'ş': 'ш', 'ç': 'ч', 'ı': 'ъ', 'ğ': 'г', 'j': 'ж', 'ü': 'ю', 'ö': 'ьо',
      'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'z': 'з', 
      'i': 'и', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 
      'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'y': 'й',
      'c': 'ц'
    };
    t = t.replace(/sh/g, 'ш').replace(/ch/g, 'ч').replace(/zh/g, 'ж').replace(/ts/g, 'ц').replace(/sht/g, 'щ').replace(/ya/g, 'я').replace(/yu/g, 'ю');
    return t.split('').map(c => map[c] || c).join('');
  };

  const check = () => {
    if (!val.trim()) {
      setStatus('idle');
      return;
    }
    const target = (item.bg || "").toLowerCase().trim();
    const inputCyrillic = toCyrillic(val);
    
    const dist = getLevenshteinDistance(inputCyrillic, target);
    
    if (dist === 0) {
      setStatus('correct');
    } else if (dist === 1) {
      setStatus('typo');
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 1200);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm space-y-4">
      <div 
        className="text-3xl font-bold text-slate-900 font-handwriting cursor-pointer hover:text-indigo-600 transition-colors inline-block"
        onClick={onSelect}
        title="Detayları görmek için tıkla"
      >
        {item.bg}
      </div>
      <div className="relative">
        <input 
          type="text" 
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          onBlur={check}
          placeholder="Buraya yazınız..." 
          className={`w-full h-14 border-2 border-dashed rounded-xl px-4 text-center font-bold outline-none transition-all ${
            status === 'correct' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
            status === 'typo' ? 'bg-amber-50 border-amber-500 text-amber-700' :
            status === 'wrong' ? 'bg-rose-50 border-rose-500 text-rose-700 animate-shake' :
            'bg-slate-50/50 border-slate-200 text-slate-700 focus:border-indigo-400 focus:bg-white'
          }`}
        />
        {status === 'correct' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
        )}
        {status === 'wrong' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500">
            <X size={24} />
          </div>
        )}
        {status === 'typo' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500">
            <CheckCircle2 size={24} />
          </div>
        )}
      </div>
      {status === 'typo' && (
        <div className="text-center text-sm font-bold text-amber-600 bg-amber-50 py-2 rounded-lg border border-amber-100">
          Ufak bir hata! Doğrusu: <span className="text-lg font-black">{item.bg}</span>
        </div>
      )}
    </div>
  );
}
