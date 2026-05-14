import React from 'react';
import { Rule } from '../types/rule';

interface RuleTooltipProps {
  rule: Rule;
  children: React.ReactNode;
}

export function RuleTooltip({ rule, children }: RuleTooltipProps) {
  return (
    <span className="relative group cursor-help underline decoration-dotted decoration-primary-400 underline-offset-4 font-medium text-slate-900">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
        <div className="font-bold border-b border-slate-700 pb-1 mb-1">
          {typeof rule.pattern === 'string' 
            ? rule.pattern 
            : `${(rule.pattern as any).source_fragment} → ${(rule.pattern as any).target_fragment}`}
        </div>
        <p className="text-slate-300 leading-relaxed">{rule.description_tr || rule.description}</p>
        <div className="mt-2 text-[10px] text-primary-400 font-medium">Örnek: {rule.examples[0].bg} → {rule.examples[0].tr}</div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
      </div>
    </span>
  );
}
