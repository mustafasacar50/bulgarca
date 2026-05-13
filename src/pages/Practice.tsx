import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Trophy } from 'lucide-react';
import { ExerciseSet, ExerciseItem } from '../types/exercise';
import { motion, AnimatePresence } from 'framer-motion';

interface PracticeProps {
  exercisePath: string;
  onBack: () => void;
}

export function Practice({ exercisePath, onBack }: PracticeProps) {
  const [exerciseSet, setExerciseSet] = useState<ExerciseSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExercises() {
      setIsLoading(true);
      try {
        const path = exercisePath.replace(/^\//, '');
        const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
        if (!res.ok) throw new Error('Alıştırmalar yüklenemedi');
        const data = await res.json();
        setExerciseSet(data);
      } catch (error) {
        console.error('Exercise loading error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
  }, [exercisePath]);

  const currentQuestion = exerciseSet?.items[currentIndex];

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion?.answer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 10);
  };

  const handleNext = () => {
    if (currentIndex < (exerciseSet?.items.length || 0) - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!exerciseSet || !currentQuestion) return <div>Alıştırma bulunamadı.</div>;

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl space-y-8"
        >
          <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Alıştırma Tamamlandı!</h2>
            <p className="text-slate-500">Tebrikler, bu dersin alıştırmalarını başarıyla bitirdin.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl inline-block px-12">
            <div className="text-4xl font-black text-primary-600">{score}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Toplam Puan</div>
          </div>
          <button 
            onClick={onBack}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
          >
            Derslere Dön
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 px-8">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / exerciseSet.items.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="text-sm font-bold text-slate-400">
          {currentIndex + 1} / {exerciseSet.items.length}
        </div>
      </header>

      <div className="space-y-8">
        <div className="space-y-4">
          <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full uppercase tracking-wider">
            {currentQuestion.type === 'multiple_choice' ? 'Çoktan Seçmeli' : 'Alıştırma'}
          </span>
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">
            {currentQuestion.prompt_tr}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.choices?.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(choice)}
              disabled={selectedAnswer !== null}
              className={`p-6 rounded-3xl text-left font-medium transition-all flex items-center justify-between group ${
                selectedAnswer === choice
                  ? isCorrect 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-4 ring-emerald-50' 
                    : 'bg-rose-50 border-rose-500 text-rose-700 ring-4 ring-rose-50'
                  : selectedAnswer !== null && choice === currentQuestion.answer
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-100 hover:border-primary-300 hover:shadow-md text-slate-700'
              } border-2`}
            >
              <span>{choice}</span>
              {selectedAnswer === choice && (
                isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedAnswer !== null && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`p-6 rounded-[32px] flex items-center justify-between ${
                isCorrect ? 'bg-emerald-500' : 'bg-slate-800'
              } text-white shadow-xl`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  {isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                </div>
                <div>
                  <div className="font-black text-lg">{isCorrect ? 'Harika!' : 'Neredeyse...'}</div>
                  <div className="text-sm opacity-90">{isCorrect ? '+10 Puan Kazandın' : `Doğru cevap: ${currentQuestion.answer}`}</div>
                </div>
              </div>
              <button 
                onClick={handleNext}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                Sonraki <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
