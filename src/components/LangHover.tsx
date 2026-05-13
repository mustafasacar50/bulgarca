import React, { useState } from 'react';
import { useDisplayPreferences } from '../state/DisplayPreferencesContext';
import { formatBulgarianText, getScriptClass } from '../utils/textFormat';

interface LangHoverProps {
  bg?: string;
  tr?: string;
  tooltip?: string;
  detail?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  forceMode?: string;
}

export function LangHover({ bg = "", tr = "", tooltip, detail, className = "", children, onClick }: LangHoverProps) {
  const { preferences } = useDisplayPreferences();
  const [showTooltip, setShowTooltip] = useState(false);

  const formattedBg = formatBulgarianText(bg, preferences);
  const scriptClass = getScriptClass(preferences);

  // Determine main display and hover text based on LanguageMode
  let mainText: string | React.ReactNode = "";
  let hoverText: string = "";

  const mode = preferences.languageMode;

  if (mode === "bg_hover_tr") {
    mainText = <span className={scriptClass}>{formattedBg}</span>;
    hoverText = tr || tooltip || "Türkçe açıklama henüz eklenmedi.";
  } else if (mode === "tr_hover_bg") {
    mainText = tr;
    hoverText = formattedBg || "Bulgarca karşılık bulunamadı.";
  } else if (mode === "both_bg_first") {
    mainText = (
      <div className="flex flex-col">
        <span className={`${scriptClass} font-bold`}>{formattedBg}</span>
        <span className="text-sm text-slate-500">{tr}</span>
      </div>
    );
    hoverText = tooltip || detail || "";
  } else if (mode === "both_tr_first") {
    mainText = (
      <div className="flex flex-col">
        <span className="font-bold">{tr}</span>
        <span className={`${scriptClass} text-sm text-slate-500`}>{formattedBg}</span>
      </div>
    );
    hoverText = tooltip || detail || "";
  } else if (mode === "quiz_hide_secondary") {
    mainText = <span className={scriptClass}>{formattedBg}</span>;
    hoverText = tr || "Cevabı görmek için tıklayın.";
  }

  return (
    <span 
      className={`relative inline-block group cursor-pointer ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
    >
      <span className="hover:text-primary-600 transition-colors">
        {children || mainText}
      </span>
      
      {hoverText && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
          {hoverText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </span>
  );
}
