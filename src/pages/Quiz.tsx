import React, { useState, useEffect, useRef } from 'react';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { Trophy, Play, RotateCcw, CheckCircle2, XCircle, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { matchAnswer, MatchResult, cyrillicToLatin } from '../utils/transliterate';
import { BulgarianKeyboard } from '../components/BulgarianKeyboard';

interface QuizQuestion {
  id: string;
  type: 'translate_bg_tr' | 'translate_tr_bg' | 'multiple_choice' | 'fill_blank';
  prompt: string;
  correctAnswer: string;
  fullAnswer?: string;
  options?: string[];
  source: string;
  hint?: string;
}

interface AnswerRecord {
  question: QuizQuestion;
  userAnswer: string;
  result: MatchResult;
}

interface QuizResult {
  date: string;
  lessons: string[];
  total: number;
  exact: number;
  close: number;
  wrong: number;
  percent: number;
}

type Phase = 'setup' | 'active' | 'result';

export function Quiz() {
  const { settings } = useDisplaySettings();
  const isRev = settings.isReversed;
  const inputRef = useRef<HTMLInputElement>(null);

  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qCount, setQCount] = useState(10);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ result: MatchResult; shown: boolean }>({ result: 'wrong', shown: false });
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [history, setHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/manifest.json`)
      .then(r => r.json())
      .then(d => {
        setLessons((d.lessons || []).filter((l: any) => !l.isDictionary).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
      });
    const s = localStorage.getItem('quiz_history');
    if (s) setHistory(JSON.parse(s));
  }, []);

  const buildQuestions = async () => {
    const lessonBank: QuizQuestion[] = [];
    const dictBank: QuizQuestion[] = [];
    
    // Helper to generate questions from items
    const genQs = (items: any[], src: string, bank: QuizQuestion[], prefix: string) => {
      items.forEach((it, i) => {
        bank.push({ id: `${prefix}-a-${i}`, type: 'translate_bg_tr', prompt: `"${it.bg}" → Türkçe?`, correctAnswer: it.tr, source: src, hint: it.transliteration });
        bank.push({ id: `${prefix}-b-${i}`, type: 'translate_tr_bg', prompt: `"${it.tr}" → Bulgarca?`, correctAnswer: it.bg, source: src });
        if (items.length >= 4) {
          const pool = items.filter((_, j) => j !== i);
          const wrongs = pool.sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.tr);
          if (wrongs.length === 3) {
            bank.push({ id: `${prefix}-c-${i}`, type: 'multiple_choice', prompt: `"${it.bg}" ne demektir?`, correctAnswer: it.tr, options: [...wrongs, it.tr].sort(() => Math.random() - 0.5), source: src });
          }
        }
        if (it.bg.length > 3) {
          const m = Math.floor(it.bg.length / 2);
          const start = Math.max(1, m - 1);
          const end = m + 1;
          const missing = it.bg.slice(start, end);
          const blanked = it.bg.slice(0, start) + '___' + it.bg.slice(end);
          bank.push({ id: `${prefix}-d-${i}`, type: 'fill_blank', prompt: `${blanked} (${it.tr})`, correctAnswer: missing, fullAnswer: it.bg, source: src });
        }
      });
    };

    // 1) Load selected lesson items
    for (const lid of selectedIds) {
      const lesson = lessons.find((l: any) => l.id === lid);
      if (!lesson) continue;
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${lesson.path.replace(/^\//, '')}`);
        const data = await res.json();
        const label = data.title_tr || lid;
        const items: any[] = [];
        (data.sections || []).forEach((sec: any) => {
          (sec.blocks || [sec]).forEach((b: any) => {
            // Standard bg/tr items
            (b.cards || b.items || b.entries || []).forEach((it: any) => {
              if (it.bg && it.tr) items.push(it);
              // Alphabet items: convert letter → bg/tr pair
              else if (it.print_upper && it.latin_hint) {
                items.push({
                  bg: it.print_upper,
                  tr: it.latin_hint,
                  transliteration: it.sound || it.latin_hint,
                  note: it.note_tr
                });
              }
            });
          });
        });
        genQs(items, label, lessonBank, lid);
      } catch (e) { console.error(e); }
    }

    // 2) Load dictionary/glossary files (always)
    const glossaryFiles = [
      'data/glossary/kucuk-sozluk-cognates.full.v3.json',
      'data/glossary/bdk-common-words.json',
      'data/glossary/a1-core-phrases.json',
      'data/glossary/a1-dialogue-phrases.json',
      'data/glossary/sentence-bank.json'
    ];
    const allDictItems: any[] = [];
    for (const gf of glossaryFiles) {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${gf}`);
        const data = await res.json();
        const entries = data.entries || data.items || data.words || [];
        entries.forEach((e: any) => {
          if (e.bg && e.tr) allDictItems.push(e);
        });
      } catch (e) { /* skip missing files */ }
    }
    // Shuffle dict items and pick a subset for question generation (max 200)
    const shuffledDict = allDictItems.sort(() => Math.random() - 0.5).slice(0, 200);
    genQs(shuffledDict, '📚 Sözlük', dictBank, 'dict');

    // 3) Shuffle both banks
    const shuffleArray = (arr: any[]): any[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    shuffleArray(lessonBank);
    shuffleArray(dictBank);

    // 4) Ensure at least 20% from dictionary
    const dictQuota = Math.max(1, Math.ceil(qCount * 0.2));
    const lessonQuota = qCount - dictQuota;

    // Pick with type variety from each bank
    const pickVaried = (bank: QuizQuestion[], count: number): QuizQuestion[] => {
      const byType: Record<string, QuizQuestion[]> = {};
      bank.forEach(q => { if (!byType[q.type]) byType[q.type] = []; byType[q.type].push(q); });
      const picked: QuizQuestion[] = [];
      const types = Object.keys(byType);
      let ti = 0;
      while (picked.length < count) {
        const t = types[ti % types.length];
        if (byType[t]?.length) picked.push(byType[t].shift()!);
        ti++;
        if (types.every(tt => !byType[tt]?.length)) break;
      }
      return picked;
    };

    const dictPicked = pickVaried(dictBank, dictQuota);
    const lessonPicked = pickVaried(lessonBank, lessonQuota);
    const final = shuffleArray([...dictPicked, ...lessonPicked]);

    setQuestions(final.slice(0, qCount));
    setIdx(0);
    setAnswers([]);
    setFeedback({ result: 'wrong', shown: false });
    setPhase('active');
  };

  const cq = questions[idx];
  const needsBgInput = cq?.type === 'translate_tr_bg' || cq?.type === 'fill_blank';

  const checkAnswer = () => {
    if (!cq) return;
    let result: MatchResult;
    const ans = cq.type === 'multiple_choice' ? (selectedOpt || '') : userAnswer;

    if (cq.type === 'multiple_choice') {
      result = selectedOpt === cq.correctAnswer ? 'exact' : 'wrong';
    } else {
      result = matchAnswer(ans, cq.correctAnswer);
    }

    setAnswers(prev => [...prev, { question: cq, userAnswer: ans, result }]);
    setFeedback({ result, shown: true });
  };

  const next = () => {
    setFeedback({ result: 'wrong', shown: false });
    setUserAnswer('');
    setSelectedOpt(null);
    if (idx + 1 >= questions.length) {
      const exact = answers.filter(a => a.result === 'exact').length;
      const close = answers.filter(a => a.result === 'close').length;
      const wrong = answers.filter(a => a.result === 'wrong').length;
      const r: QuizResult = { date: new Date().toISOString(), lessons: selectedIds, total: questions.length, exact, close, wrong, percent: Math.round(((exact + close * 0.5) / questions.length) * 100) };
      const nh = [r, ...history].slice(0, 20);
      setHistory(nh);
      localStorage.setItem('quiz_history', JSON.stringify(nh));
      setPhase('result');
    } else {
      setIdx(i => i + 1);
    }
  };

  const toggle = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ─── SETUP ───
  if (phase === 'setup') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center"><Trophy size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{isRev ? 'Тест' : 'Quiz Modu'}</h1>
            <p className="text-sm text-slate-500">{isRev ? 'Изберете уроци и започнете' : 'Derslerden rastgele sorularla test et'}</p>
          </div>
        </header>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-slate-800">{isRev ? 'Изберете уроци' : 'Ders Seçimi'}</h2>
          <div className="space-y-2">
            {lessons.map((l: any) => (
              <label key={l.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedIds.includes(l.id) ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                <input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggle(l.id)} className="w-5 h-5 accent-primary-600 rounded-lg" />
                <div className="flex-1">
                  <span className="text-[10px] font-black text-primary-500 uppercase">DERS {l.order}</span>
                  <div className="font-bold text-slate-800 text-sm">{isRev ? (l.title_bg || l.title_tr) : l.title_tr}</div>
                </div>
              </label>
            ))}
          </div>
          <button onClick={() => setSelectedIds(lessons.map((l: any) => l.id))} className="text-xs font-bold text-primary-500 hover:text-primary-700">{isRev ? 'Избери всички' : 'Tümünü Seç'}</button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-slate-800">{isRev ? 'Брой въпроси' : 'Soru Sayısı'}</h2>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 30].map(n => (
              <button key={n} onClick={() => setQCount(n)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${qCount === n ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}>{n}</button>
            ))}
          </div>
        </div>

        <button onClick={buildQuestions} disabled={selectedIds.length === 0} className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3">
          <Play size={24} />{isRev ? 'Започни' : "Quiz'e Başla"}
        </button>

        {history.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" />{isRev ? 'Предишни резултати' : 'Geçmiş Sonuçlar'}</h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <div className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString('tr-TR')}</div>
                    <div className="text-sm font-bold text-slate-700">
                      <span className="text-emerald-500">{r.exact}✓</span> <span className="text-amber-500">{r.close}≈</span> <span className="text-rose-400">{r.wrong}✗</span> / {r.total}
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${r.percent >= 80 ? 'text-emerald-500' : r.percent >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>%{r.percent}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ACTIVE ───
  if (phase === 'active' && cq) {
    const progress = ((idx + 1) / questions.length) * 100;
    const exactCount = answers.filter(a => a.result === 'exact').length;
    const closeCount = answers.filter(a => a.result === 'close').length;

    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{isRev ? 'Въпрос' : 'Soru'} {idx + 1}/{questions.length}</span>
            <span>✓{exactCount} ≈{closeCount}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <span className="px-2 py-0.5 bg-primary-50 text-primary-500 rounded">
              {cq.type === 'translate_bg_tr' ? 'BG→TR' : cq.type === 'translate_tr_bg' ? 'TR→BG' : cq.type === 'multiple_choice' ? (isRev ? 'ИЗБОР' : 'SEÇMELİ') : (isRev ? 'ПОПЪЛВАНЕ' : 'BOŞLUK')}
            </span>
            <span className="text-slate-400 truncate">• {cq.source}</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 leading-relaxed">{cq.prompt}</h2>
          {cq.hint && !feedback.shown && <p className="text-xs text-slate-400 italic">💡 {cq.hint}</p>}
          {needsBgInput && !feedback.shown && <p className="text-[10px] text-slate-400">Kiril veya Latin harflerle yazabilirsiniz</p>}

          {!feedback.shown && (
            <>
              {cq.type === 'multiple_choice' && cq.options ? (
                <div className="space-y-2">
                  {cq.options.map((opt, i) => (
                    <button key={i} onClick={() => setSelectedOpt(opt)} className={`w-full text-left p-4 rounded-2xl font-medium transition-all border ${selectedOpt === opt ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700'}`}>
                      <span className="text-xs font-black text-slate-400 mr-3">{String.fromCharCode(65 + i)}</span>{opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <input ref={inputRef} type="text" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && userAnswer.trim() && checkAnswer()} placeholder={isRev ? 'Вашият отговор...' : 'Cevabınızı yazın...'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-lg font-medium" autoFocus />
                  {needsBgInput && (
                    <BulgarianKeyboard
                      onKey={c => { setUserAnswer(p => p + c); inputRef.current?.focus(); }}
                      onBackspace={() => { setUserAnswer(p => p.slice(0, -1)); inputRef.current?.focus(); }}
                      onEnter={() => { if (userAnswer.trim()) checkAnswer(); }}
                    />
                  )}
                </div>
              )}
              <button onClick={checkAnswer} disabled={cq.type === 'multiple_choice' ? !selectedOpt : !userAnswer.trim()} className="w-full py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {isRev ? 'Проверка' : 'Kontrol Et'}
              </button>
            </>
          )}

          {feedback.shown && (
            <div className={`p-5 rounded-2xl border-2 ${feedback.result === 'exact' ? 'bg-emerald-50 border-emerald-200' : feedback.result === 'close' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback.result === 'exact' && <><CheckCircle2 size={24} className="text-emerald-500" /><span className="font-bold text-emerald-700">{isRev ? 'Правилно!' : 'Doğru!'}</span></>}
                {feedback.result === 'close' && <><AlertCircle size={24} className="text-amber-500" /><span className="font-bold text-amber-700">{isRev ? 'Почти!' : 'Neredeyse!'}</span></>}
                {feedback.result === 'wrong' && <><XCircle size={24} className="text-rose-500" /><span className="font-bold text-rose-700">{isRev ? 'Грешка!' : 'Yanlış!'}</span></>}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-500">{isRev ? 'Вашият отговор:' : 'Senin cevabın:'} <strong className="text-slate-800">{answers[answers.length - 1]?.userAnswer || '-'}</strong></p>
                {feedback.result !== 'exact' && (
                  <p className="text-slate-500">{isRev ? 'Правилен отговор:' : 'Doğru cevap:'} <strong className="text-slate-900">{cq.correctAnswer}</strong>
                    {cq.type === 'fill_blank' && cq.fullAnswer && <span className="text-primary-600 ml-2">({cq.fullAnswer})</span>}
                    {needsBgInput && cq.type !== 'fill_blank' && <span className="text-slate-400 ml-2">({cyrillicToLatin(cq.correctAnswer)})</span>}
                  </p>
                )}
              </div>
              <button onClick={next} className="mt-4 w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                {idx + 1 >= questions.length ? (isRev ? 'Резултати' : 'Sonuçları Gör') : (isRev ? 'Следващ' : 'Sonraki Soru')}<ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULT ───
  if (phase === 'result') {
    const exact = answers.filter(a => a.result === 'exact').length;
    const close = answers.filter(a => a.result === 'close').length;
    const wrong = answers.filter(a => a.result === 'wrong').length;
    const percent = Math.round(((exact + close * 0.5) / questions.length) * 100);
    const emoji = percent >= 90 ? '🏆' : percent >= 70 ? '🎉' : percent >= 50 ? '💪' : '📚';

    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 space-y-6 text-center">
          <div className="text-6xl">{emoji}</div>
          <h1 className="text-3xl font-black text-slate-900">{isRev ? 'Тест завършен!' : 'Quiz Tamamlandı!'}</h1>
          <div className="flex items-center justify-center gap-6">
            <div><div className="text-3xl font-black text-emerald-500">{exact}</div><div className="text-[10px] font-bold text-slate-400 uppercase">Doğru ✓</div></div>
            <div className="h-12 w-px bg-slate-200" />
            <div><div className="text-3xl font-black text-amber-500">{close}</div><div className="text-[10px] font-bold text-slate-400 uppercase">Yakın ≈</div></div>
            <div className="h-12 w-px bg-slate-200" />
            <div><div className="text-3xl font-black text-rose-500">{wrong}</div><div className="text-[10px] font-bold text-slate-400 uppercase">Yanlış ✗</div></div>
            <div className="h-12 w-px bg-slate-200" />
            <div><div className={`text-4xl font-black ${percent >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>%{percent}</div></div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => { setPhase('setup'); setQuestions([]); setAnswers([]); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 flex items-center justify-center gap-2"><RotateCcw size={18} />{isRev ? 'Нов тест' : 'Yeni Quiz'}</button>
            <button onClick={buildQuestions} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 flex items-center justify-center gap-2"><Play size={18} />{isRev ? 'Повтори' : 'Tekrar'}</button>
          </div>
        </div>

        {/* Per-question review */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
          <h2 className="font-bold text-slate-800 mb-4">{isRev ? 'Подробен преглед' : 'Detaylı İnceleme'}</h2>
          {answers.map((a, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${a.result === 'exact' ? 'border-emerald-200 bg-emerald-50/50' : a.result === 'close' ? 'border-amber-200 bg-amber-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 mb-1">#{i + 1} • {a.question.source}</div>
                  <div className="font-bold text-slate-800 text-sm mb-1">{a.question.prompt}</div>
                  <div className="text-sm">
                    <span className="text-slate-500">Cevabın: </span>
                    <span className={`font-bold ${a.result === 'exact' ? 'text-emerald-600' : a.result === 'close' ? 'text-amber-600' : 'text-rose-600'}`}>{a.userAnswer || '—'}</span>
                    {a.result !== 'exact' && (
                      <span className="text-slate-400"> → <strong className="text-slate-700">{a.question.correctAnswer}</strong>
                        {a.question.type === 'fill_blank' && a.question.fullAnswer && <span className="text-primary-500 ml-1">({a.question.fullAnswer})</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-lg">
                  {a.result === 'exact' ? '✅' : a.result === 'close' ? '🟡' : '❌'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
