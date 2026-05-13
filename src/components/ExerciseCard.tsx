import React, { useState } from 'react';
import { ExerciseItem } from '../types/exercise';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface ExerciseCardProps {
  item: ExerciseItem;
  onNext: (isCorrect: boolean) => void;
}

export function ExerciseCard({ item, onNext }: ExerciseCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setIsAnswered(true);
  };

  const isCorrect = selected === item.answer;

  return (
    <div className="card p-6 space-y-6">
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-bold text-primary-500 tracking-widest">Soru</div>
        <h3 className="text-xl font-bold text-slate-800">{item.prompt_tr}</h3>
      </div>

      <div className="space-y-3">
        {item.choices?.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={isAnswered}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium ${
              selected === option
                ? isAnswered
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-100 hover:border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {isAnswered && selected === option && (
                isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />
              )}
              {isAnswered && option === item.answer && selected !== option && (
                <CheckCircle size={20} className="text-emerald-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      {!isAnswered ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            selected ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Cevabı Kontrol Et
        </button>
      ) : (
        <button
          onClick={() => onNext(isCorrect)}
          className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
        >
          Sıradaki Soru
          <ArrowRight size={20} />
        </button>
      )}
    </div>
  );
}
