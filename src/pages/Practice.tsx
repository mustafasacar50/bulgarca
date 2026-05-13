import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Trophy } from 'lucide-react';
import { ExerciseSet, Question } from '../types/exercise';
import { ExerciseCard } from '../components/ExerciseCard';

interface PracticeProps {
  lessonId: string;
  onBack: () => void;
}

export function Practice({ lessonId, onBack }: PracticeProps) {
  const [exercises, setExercises] = useState<ExerciseSet | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExercises() {
      setIsLoading(true);
      try {
        const manifestRes = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`);
        const manifest = await manifestRes.json();
        
        const exerciseMeta = manifest.exercises?.find((e: any) => e.lessonId === lessonId);
        if (exerciseMeta) {
          const res = await fetch(`${import.meta.env.BASE_URL}${exerciseMeta.filePath.replace(/^\//, '')}`);
          const data = await res.json();
          setExercises(data);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
  }, [lessonId]);

  const handleNext = (isCorrect: boolean) => {
    if (isCorrect) setScore(s => s + 1);
    
    if (exercises && currentQuestionIdx < exercises.questions.length - 1) {
      setCurrentQuestionIdx(idx => idx + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!exercises) return <div className="text-center py-20">Bu ders için alıştırma bulunamadı.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
          <Brain size={16} className="text-primary-500" />
          <span className="text-sm font-bold text-slate-700">Alıştırma Modu</span>
        </div>
        <div className="w-10"></div>
      </header>

      {!isFinished ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-400 font-bold uppercase tracking-widest px-2">
            <span>Soru {currentQuestionIdx + 1} / {exercises.questions.length}</span>
            <span>Puan: {score}</span>
          </div>
          
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500" 
              style={{ width: `${((currentQuestionIdx) / exercises.questions.length) * 100}%` }}
            />
          </div>

          <ExerciseCard 
            question={exercises.questions[currentQuestionIdx]} 
            onNext={handleNext} 
          />
        </div>
      ) : (
        <div className="card p-12 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Tebrikler!</h2>
            <p className="text-slate-500">Alıştırmayı başarıyla tamamladın.</p>
          </div>
          <div className="py-4 px-8 bg-slate-50 rounded-2xl inline-block">
            <div className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Skorun</div>
            <div className="text-4xl font-bold text-slate-900">{score} / {exercises.questions.length}</div>
          </div>
          <button 
            onClick={onBack}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all"
          >
            Derslere Dön
          </button>
        </div>
      )}
    </div>
  );
}
