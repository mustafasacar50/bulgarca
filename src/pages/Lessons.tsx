import React, { useState, useEffect } from 'react';
import { LessonMeta } from '../types/lesson';
import { Search, BookOpen, CheckCircle2 } from 'lucide-react';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { useAuth } from '../state/AuthContext';
import { getGithubFile } from '../engine/githubSync';

interface LessonsProps {
  onSelectLesson: (id: string) => void;
}

export function Lessons({ onSelectLesson }: LessonsProps) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { settings } = useDisplaySettings();
  const isRev = settings.isReversed;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/manifest.json`)
      .then(res => res.json())
      .then(data => {
        const sorted = (data.lessons || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setLessons(sorted);
      });
      
    const loadProgress = async () => {
      if (user?.token) {
        try {
          const res = await getGithubFile({
            token: user.token,
            owner: 'mustafasacar50',
            repo: 'bulgarca-user-data',
            path: `users/${user.username}/progress.json`,
            branch: 'main'
          });
          if (res?.content) {
            setCompletedIds(res.content.completedLessons || []);
          }
        } catch (e) { /* skip */ }
      }
    };
    loadProgress();
  }, [user]);

  const filteredLessons = lessons.filter(l => 
    l.title_tr.toLowerCase().includes(search.toLowerCase()) || 
    (l.summary_tr || '').toLowerCase().includes(search.toLowerCase()) ||
    ((l as any).title_bg || '').toLowerCase().includes(search.toLowerCase())
  );

  const lt = (lesson: any, field: string = 'title') => {
    if (isRev) return lesson[`${field}_bg`] || lesson[`${field}_tr`] || '';
    return lesson[`${field}_tr`] || '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRev ? 'Всички уроци' : 'Tüm Dersler'}</h1>
          <p className="text-slate-500 text-sm">{isRev ? 'Намерете подходящите уроци за вашето ниво.' : 'Seviyene uygun dersleri buradan bulabilirsin.'}</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={isRev ? "Търси урок..." : "Ders ara..."} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-8">
        {Object.entries(
          filteredLessons.reduce((acc: Record<number, LessonMeta[]>, lesson) => {
            const week = lesson.week || 99;
            if (!acc[week]) acc[week] = [];
            acc[week].push(lesson);
            return acc;
          }, {})
        ).sort(([a], [b]) => Number(a) - Number(b)).map(([weekStr, weekLessons]) => {
          const week = Number(weekStr);
          return (
            <div key={week} className="space-y-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">
                {week === 99 
                  ? (isRev ? 'Източници и инструменти' : 'Kaynaklar & Araçlar') 
                  : (isRev ? `${week}. СЕДМИЦА` : `${week}. HAFTA`)
                }
              </h2>
              <div className="space-y-3">
                {weekLessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="bg-white border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group flex items-center justify-between gap-4"
                    onClick={() => onSelectLesson(lesson.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        lesson.isDictionary 
                        ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100 group-hover:text-rose-600' 
                        : 'bg-primary-50 text-primary-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                      }`}>
                        <BookOpen size={24} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                          {lesson.isDictionary ? (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-tighter">{isRev ? 'РЕЧНИК' : 'SÖZLÜK'}</span>
                          ) : (
                            <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-tighter">{isRev ? `УРОК ${lesson.order || '?'}` : `DERS ${lesson.order || '?'}`}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-base line-clamp-1">{lt(lesson)}</h3>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-4">
                      <p className="text-sm text-slate-500 line-clamp-1 max-w-sm">{lt(lesson, 'summary') || (isRev ? 'Няма описание за този урок.' : 'Bu ders için açıklama bulunmuyor.')}</p>
                      <div className="flex items-center gap-2">
                        {completedIds.includes(lesson.id) && (
                          <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shadow-sm" title="Tamamlandı">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider shrink-0">{lesson.level}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
