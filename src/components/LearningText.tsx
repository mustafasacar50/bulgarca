import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDisplaySettings } from '../state/DisplaySettingsContext';
import { useGlossary } from '../state/GlossaryContext';
import { formatBulgarianText, getScriptClass } from '../utils/textFormat';

interface LearningTextProps {
  bg?: string;
  tr?: string;
  tooltip_tr?: string;
  tooltip_bg?: string;
  detail?: any;
  type?: "letter" | "word" | "rule" | "phrase" | "sentence" | "example";
  ruleIds?: string[];
  onSelect?: (detail: any) => void;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3';
}

export function LearningText({ 
  bg = "", 
  tr = "", 
  tooltip_tr,
  tooltip_bg,
  detail: propDetail,
  type = "word",
  ruleIds = [],
  onSelect,
  className = "", 
  as: Component = 'span'
}: LearningTextProps) {
  const { settings } = useDisplaySettings();
  const { lookup } = useGlossary();
  const [showTooltip, setShowTooltip] = useState(false);

  // Fallback lookup if translation is missing
  let resolvedTr = tr;
  let resolvedDetail = propDetail;
  
  if (!resolvedTr && bg && type === "word") {
    const entry = lookup(bg);
    if (entry) {
      resolvedTr = entry.tr;
      if (!resolvedDetail) resolvedDetail = entry;
    }
  }

  const scriptClass = getScriptClass(settings);
  const formattedBg = formatBulgarianText(bg, settings);

  const renderWithMarkers = (text: string, isBg: boolean) => {
    if (!isBg) return text;
    let rawMarkers = (resolvedDetail?.rule_marks || resolvedDetail?.markers || []);
    // Safety check: ensure markers is an array
    const markers = Array.isArray(rawMarkers) ? rawMarkers : (rawMarkers ? [rawMarkers] : []);

    if (settings.markerMode === "off" || !markers || markers.length === 0 || !markers[0]) {
      return text;
    }
    
    let result: (string | React.ReactNode)[] = [text];
    
    markers.forEach((marker: any, mIdx: number) => {
      if (!marker || typeof marker !== 'object') return;
        // Determine the fragment to highlight based on whether we are rendering BG or TR
        let fragment = "";
        if (isBg) {
          fragment = marker.bg_fragment || marker.target_fragment || marker.bg_source || marker.target || marker.to || marker.source || marker.from;
          if (settings.scriptMode === 'handwriting' && fragment) {
              // If it's handwriting mode, we might need to apply the same format if possible
              // but for fragments it's safer to keep as is or match normalized
          }
        } else {
          fragment = marker.tr_fragment || marker.source_fragment || marker.tr_source || marker.source || marker.from;
        }

      if (!fragment) return;

      const newResult: (string | React.ReactNode)[] = [];
      result.forEach((segment, sIdx) => {
        if (typeof segment !== 'string') {
          newResult.push(segment);
          return;
        }
        
        // Use case-insensitive search for fragments
        const escapedFrag = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = segment.split(new RegExp(`(${escapedFrag})`, 'gi'));
        
        const colorKey = marker.color_key || 'primary';
        const colorClasses: Record<string, { strong: string, soft: string }> = {
          primary: { strong: 'bg-primary-500 text-white', soft: 'bg-primary-100/50 border-primary-400' },
          indigo: { strong: 'bg-indigo-600 text-white', soft: 'bg-indigo-100/50 border-indigo-400' },
          emerald: { strong: 'bg-emerald-600 text-white', soft: 'bg-emerald-100/50 border-emerald-400' },
          blue: { strong: 'bg-blue-600 text-white', soft: 'bg-blue-100/50 border-blue-400' }
        };
        const activeColor = colorClasses[colorKey] || colorClasses.primary;

        parts.forEach((part, pIdx) => {
          if (part.toLowerCase() === fragment.toLowerCase()) {
            newResult.push(
              <span 
                key={`m-${mIdx}-s-${sIdx}-p-${pIdx}`} 
                className={settings.markerMode === 'strong' 
                  ? `${activeColor.strong} px-0.5 rounded shadow-sm` 
                  : `${activeColor.soft} px-0.5 rounded border-b-2 font-bold`}
                title={marker.tooltip_tr || marker.rule_id}
              >
                {part}
              </span>
            );
          } else {
            newResult.push(part);
          }
        });
      });
      result = newResult;
    });
    
    return result;
  };

  // Determine display based on LanguageMode
  let content: React.ReactNode = "";
  let hoverMsg: string = "";

  const mode = settings.languageMode;

  let effectiveMode = mode;
  if (settings.isReversed) {
    if (mode === "bg_hover_tr") effectiveMode = "tr_hover_bg";
    else if (mode === "tr_hover_bg") effectiveMode = "bg_hover_tr";
  }

  if (effectiveMode === "bg_hover_tr") {
    content = <span className={scriptClass}>{renderWithMarkers(formattedBg, true)}</span>;
    hoverMsg = resolvedTr || tooltip_tr || "";
  } else if (effectiveMode === "tr_hover_bg") {
    content = <span>{renderWithMarkers(resolvedTr, false)}</span>;
    hoverMsg = formattedBg || tooltip_bg || "";
  } else if (effectiveMode === "bg_tr") {
    if (settings.isReversed) {
      content = (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-slate-900">{renderWithMarkers(resolvedTr, false)}</span>
          <span className={`${scriptClass} text-xs text-slate-500 font-medium`}>{renderWithMarkers(formattedBg, true)}</span>
        </div>
      );
    } else {
      content = (
        <div className="flex flex-col leading-tight">
          <span className={`${scriptClass} font-bold text-slate-900`}>{renderWithMarkers(formattedBg, true)}</span>
          <span className="text-xs text-slate-500 font-medium">{renderWithMarkers(resolvedTr, false)}</span>
        </div>
      );
    }
    hoverMsg = tooltip_tr || "";
  } else if (effectiveMode === "quiz_hidden") {
    if (settings.isReversed) {
      content = (
        <div className="flex flex-col items-start leading-tight relative group">
          <span className={`${scriptClass} text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5`}>{renderWithMarkers(formattedBg, true) || "???"}</span>
          <span className="font-bold text-slate-900 blur-[4px] hover:blur-none transition-all duration-300 cursor-help select-none bg-slate-200/50 hover:bg-transparent rounded px-1 -ml-1">
            {renderWithMarkers(resolvedTr, false)}
          </span>
        </div>
      );
    } else {
      content = (
        <div className="flex flex-col items-start leading-tight relative group">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{renderWithMarkers(resolvedTr, false) || "???"}</span>
          <span className={`${scriptClass} font-bold text-slate-900 blur-[4px] hover:blur-none transition-all duration-300 cursor-help select-none bg-slate-200/50 hover:bg-transparent rounded px-1 -ml-1`}>
            {renderWithMarkers(formattedBg, true)}
          </span>
        </div>
      );
    }
    hoverMsg = tooltip_tr || "Cevap için üzerine gelin";
  }

  const spanRef = useRef<HTMLElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showTooltip && spanRef.current) {
      const updatePosition = () => {
        if (spanRef.current) {
          const rect = spanRef.current.getBoundingClientRect();
          setTooltipPos({
            top: rect.top - 8,
            left: rect.left + rect.width / 2
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showTooltip]);

  return (
    <Component 
      ref={spanRef as any}
      className={`relative inline-block group cursor-pointer transition-all duration-200 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect(resolvedDetail || { bg, tr: resolvedTr, type });
        }
      }}
    >
      <span className="group-hover:text-primary-600">
        {content}
      </span>
      
      {hoverMsg && showTooltip && createPortal(
        <div 
          className="fixed -translate-x-1/2 -translate-y-full w-max max-w-[240px] p-2 bg-slate-900 text-white text-[10px] font-medium rounded-lg shadow-2xl z-[99999] pointer-events-none text-center"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          {hoverMsg}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>,
        document.body
      )}
    </Component>
  );
}
