import React, { useState } from 'react';
import { Keyboard, ChevronUp, ChevronDown } from 'lucide-react';

const BG_ROWS_LOWER = [
  ['я','в','е','р','т','ъ','у','и','о','п','ш','щ'],
  ['а','с','д','ф','г','х','й','к','л'],
  ['з','ь','ц','ж','б','н','м','ч','ю']
];
const BG_ROWS_UPPER = BG_ROWS_LOWER.map(row => row.map(c => c.toUpperCase()));

interface Props {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

export function BulgarianKeyboard({ onKey, onBackspace, onEnter }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpper, setIsUpper] = useState(false);
  const rows = isUpper ? BG_ROWS_UPPER : BG_ROWS_LOWER;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
        type="button"
      >
        <Keyboard size={16} />
        BG Klavye
      </button>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-1 shadow-lg">
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Българска Клавиатура</span>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600" type="button">
          <ChevronDown size={16} />
        </button>
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-0.5 justify-center">
          {ri === 2 && (
            <button
              onClick={() => setIsUpper(!isUpper)}
              className={`px-2.5 py-2.5 rounded-lg text-[10px] font-bold transition-all ${isUpper ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              type="button"
            >
              {isUpper ? '⬆' : '⬇'}
            </button>
          )}
          {row.map((char) => (
            <button
              key={char}
              onClick={() => { onKey(char); if (isUpper) setIsUpper(false); }}
              className="w-8 h-9 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all active:scale-90 shadow-sm"
              type="button"
            >
              {char}
            </button>
          ))}
          {ri === 2 && (
            <button
              onClick={onBackspace}
              className="px-2.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"
              type="button"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-0.5 justify-center pt-0.5">
        <button onClick={() => onKey(' ')} className="flex-1 h-9 bg-white border border-slate-200 rounded-lg text-xs text-slate-400 hover:bg-slate-100 transition-all" type="button">
          пробел
        </button>
        <button onClick={onEnter} className="px-6 h-9 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-all" type="button">
          ✓
        </button>
      </div>
    </div>
  );
}
