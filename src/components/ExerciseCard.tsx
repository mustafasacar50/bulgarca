import React, { useState, useEffect } from 'react';
import { ExerciseItem } from '../types/exercise';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, PenTool } from 'lucide-react';
import { LearningText } from './LearningText';

interface ExerciseCardProps {
  item: ExerciseItem | any;
  onNext: (isCorrect: boolean) => void;
}

export function ExerciseCard({ item, onNext }: ExerciseCardProps) {
  const [selected, setSelected] = useState<any>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [orderState, setOrderState] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");

  // Reset state when item changes
  useEffect(() => {
    setSelected(null);
    setIsAnswered(false);
    setFeedback(null);
    setOrderState([]);
    setInputText("");
  }, [item.exercise_id]);

  const handleMultipleChoice = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    setIsAnswered(true);
  };

  const handleDialogueOrder = (line: string) => {
    if (isAnswered) return;
    if (orderState.includes(line)) {
      setOrderState(orderState.filter(l => l !== line));
    } else {
      const newState = [...orderState, line];
      setOrderState(newState);
      if (newState.length === item.lines.length) {
        setIsAnswered(true);
      }
    }
  };

  const checkOrder = () => {
    const isCorrect = JSON.stringify(orderState) === JSON.stringify(item.answer);
    return isCorrect;
  };

  const renderContent = () => {
    switch (item.type) {
      case 'multiple_choice':
      case 'choose_rule':
        return (
          <div className="grid grid-cols-1 gap-3">
            {item.choices?.map((option: string) => {
              const isCorrect = option === item.answer;
              const isSelected = selected === option;
              let btnClass = "border-slate-100 hover:border-primary-300 text-slate-700";
              
              if (isAnswered) {
                if (isCorrect) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700";
                else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-700";
                else btnClass = "opacity-50 border-slate-100";
              } else if (isSelected) {
                btnClass = "border-primary-500 bg-primary-50 text-primary-700";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleMultipleChoice(option)}
                  disabled={isAnswered}
                  className={`p-4 text-left rounded-2xl border-2 transition-all font-medium flex justify-between items-center ${btnClass}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle size={18} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle size={18} />}
                </button>
              );
            })}
          </div>
        );

      case 'dialogue_order':
        const isCorrectOrder = isAnswered && checkOrder();
        return (
          <div className="space-y-6">
            <div className="min-h-[100px] p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-wrap gap-2 content-start">
              {orderState.length === 0 && <span className="text-slate-400 text-sm italic">Sıralamak için aşağıdaki satırlara tıkla...</span>}
              {orderState.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`px-3 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 ${isAnswered ? (checkOrder() ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-white text-slate-900 border border-slate-200'}`}
                >
                  <span className="opacity-50 text-[10px]">{idx + 1}</span>
                  {line}
                </div>
              ))}
            </div>

            {!isAnswered && (
              <div className="grid grid-cols-1 gap-2">
                {item.lines.filter((l: string) => !orderState.includes(l)).map((line: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleDialogueOrder(line)}
                    className="p-3 text-left bg-white border border-slate-200 rounded-xl hover:border-primary-400 transition-colors text-sm font-medium"
                  >
                    {line}
                  </button>
                ))}
              </div>
            )}
            
            {isAnswered && !isCorrectOrder && (
               <button 
                onClick={() => { setOrderState([]); setIsAnswered(false); }}
                className="flex items-center gap-2 text-primary-600 font-bold text-sm hover:underline"
               >
                 <RotateCcw size={16} /> Tekrar Dene
               </button>
            )}
          </div>
        );

      case 'self_introduction':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3">
              <PenTool size={20} className="text-indigo-500 flex-shrink-0" />
              <p className="text-sm text-indigo-900 leading-relaxed italic">
                {item.prompt_tr}
              </p>
            </div>
            
            <textarea
              disabled={isAnswered}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Bulgarca tanıtımını buraya yaz..."
              className="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-slate-800"
            />

            {!isAnswered ? (
              <button
                onClick={() => setIsAnswered(true)}
                disabled={!inputText.trim()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-30 transition-all"
              >
                Yazımı Tamamladım
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Örnek Çözüm</div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="font-bold text-emerald-900 mb-1">{item.model_answer_bg}</div>
                  <div className="text-xs text-emerald-700">{item.model_answer_tr}</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'write_bg':
        return (
          <div className="space-y-4">
             <input
              type="text"
              disabled={isAnswered}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inputText.trim() && setIsAnswered(true)}
              placeholder="Bulgarca karşılığını yaz..."
              className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-400 outline-none transition-all font-bold text-slate-800"
            />
            {isAnswered && (
               <div className={`p-4 rounded-2xl border ${inputText.trim().toLowerCase() === item.answer.toLowerCase() ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                 <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Doğru Cevap</div>
                 <div className="font-bold">{item.answer}</div>
               </div>
            )}
            {!isAnswered && (
               <button
               onClick={() => setIsAnswered(true)}
               disabled={!inputText.trim()}
               className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-30 transition-all"
             >
               Kontrol Et
             </button>
            )}
          </div>
        );

      default:
        return (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 italic">Bu alıştırma tipi ({item.type}) henüz desteklenmiyor.</p>
          </div>
        );
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-bold text-primary-500 tracking-widest flex justify-between">
          <span>{item.type.replace('_', ' ')}</span>
          {item.level && <span>Level {item.level}</span>}
        </div>
        <h3 className="text-xl font-bold text-slate-800 leading-snug">{item.prompt_tr}</h3>
      </div>

      {renderContent()}

      {isAnswered && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          {item.explanation_tr && (
            <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-xl">
              {item.explanation_tr}
            </div>
          )}
          
          <button
            onClick={() => onNext(item.type === 'dialogue_order' ? checkOrder() : (item.type === 'multiple_choice' ? selected === item.answer : true))}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            Sıradaki Soru
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
