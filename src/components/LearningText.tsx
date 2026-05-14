import React, { useState } from 'react';
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

  const renderWithMarkers = (text: string) => {
    // Collect all markers from ruleIds if possible, but usually markers are passed directly.
    // In this MVP, we use the markers passed in the detail or props if available.
    // For now, let's assume markers are in detail or passed as a separate prop if needed.
    const markers = (resolvedDetail?.markers || []);

    if (settings.markerMode === "off" || !markers || markers.length === 0) {
      return text;
    }
    
    let result: (string | React.ReactNode)[] = [text];
    
    markers.forEach((marker: any, mIdx: number) => {
      const source = formatBulgarianText(marker.source || marker.from, settings);
      const target = formatBulgarianText(marker.target || marker.to || marker.from, settings);

      const newResult: (string | React.ReactNode)[] = [];
      result.forEach((segment, sIdx) => {
        if (typeof segment !== 'string') {
          newResult.push(segment);
          return;
        }
        
        const parts = segment.split(source);
        parts.forEach((part, pIdx) => {
          newResult.push(part);
          if (pIdx < parts.length - 1) {
            newResult.push(
              <span 
                key={`m-${mIdx}-s-${sIdx}-p-${pIdx}`} 
                className={settings.markerMode === 'strong' ? 'bg-primary-500 text-white px-0.5 rounded' : 'bg-primary-100/50 px-0.5 rounded border-b border-primary-300'}
                title={marker.tooltip_tr}
              >
                {target}
              </span>
            );
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

  if (mode === "bg_hover_tr") {
    content = <span className={scriptClass}>{renderWithMarkers(formattedBg)}</span>;
    hoverMsg = resolvedTr || tooltip_tr || "";
  } else if (mode === "tr_hover_bg") {
    content = <span>{resolvedTr}</span>;
    hoverMsg = formattedBg || tooltip_bg || "";
  } else if (mode === "bg_tr") {
    content = (
      <div className="flex flex-col leading-tight">
        <span className={`${scriptClass} font-bold text-slate-900`}>{renderWithMarkers(formattedBg)}</span>
        <span className="text-xs text-slate-500 font-medium">{resolvedTr}</span>
      </div>
    );
    hoverMsg = tooltip_tr || "";
  } else if (mode === "quiz_hidden") {
    content = <span className={scriptClass}>{renderWithMarkers(formattedBg)}</span>;
    hoverMsg = resolvedTr || "Cevap için tıklayın";
  }

  return (
    <Component 
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
      
      {hoverMsg && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] p-2 bg-slate-900 text-white text-[10px] font-medium rounded-lg shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 text-center">
          {hoverMsg}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </Component>
  );
}
