import React, { useState, useEffect } from 'react';
import { LessonMeta } from '../types/lesson';
import { Search, BookOpen } from 'lucide-react';

interface LessonsProps {
  onSelectLesson: (id: string) => void;
}

export function Lessons({ onSelectLesson }: LessonsProps) {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/manifest.json`)
      .then(res => res.json())
      .then(data => {
        const sorted = (data.lessons || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setLessons(sorted);
      });
  }, []);

  const filteredLessons = lessons.filter(l => 
    l.title_tr.toLowerCase().includes(search.toLowerCase()) || 
    (l.summary_tr || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tüm Dersler</h1>
          <p className="text-slate-500 text-sm">Seviyene uygun dersleri buradan bulabilirsin.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Ders ara..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map((lesson) => (
          <div 
            key={lesson.id} 
            className="card p-6 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all group"
            onClick={() => onSelectLesson(lesson.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <BookOpen size={20} />
              </div>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">{lesson.level}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">DERS {lesson.order || '?'}</span>
              <h3 className="font-bold text-slate-800">{lesson.title_tr}</h3>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2">{lesson.summary_tr || 'Bu ders için açıklama bulunmuyor.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
