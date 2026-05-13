import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Clock, ArrowRight } from 'lucide-react';
import { LessonMeta } from '../types/lesson';

interface DashboardProps {
  onStartLesson: (id: string) => void;
}

export function Dashboard({ onStartLesson }: DashboardProps) {
  const [recentLessons, setRecentLessons] = useState<LessonMeta[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/manifest.json`)
      .then(res => res.json())
      .then(data => setRecentLessons(data.lessons.slice(0, 3)));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Merhaba Mustafa!</h1>
        <p className="text-slate-500">Bugün Bulgarca öğrenmeye devam edelim mi?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">1/12</div>
            <div className="text-sm text-slate-500">Ders Tamamlandı</div>
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">45</div>
            <div className="text-sm text-slate-500">Kazanılan Puan</div>
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">3 Gün</div>
            <div className="text-sm text-slate-500">Öğrenme Serisi</div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Sıradaki Dersler</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentLessons.map((lesson) => (
            <div key={lesson.id} className="card p-6 flex items-center justify-between group cursor-pointer hover:border-primary-200 transition-all" onClick={() => onStartLesson(lesson.id)}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded uppercase tracking-wider">{lesson.level}</span>
                  <h3 className="font-bold text-slate-800">{lesson.title_tr}</h3>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">{lesson.summary_tr || 'Bu ders için açıklama bulunmuyor.'}</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <ArrowRight size={18} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
