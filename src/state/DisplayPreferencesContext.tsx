import React, { createContext, useContext, useState, useEffect } from 'react';

export type ScriptMode = "print" | "handwriting";

export type LetterCaseMode =
  | "uppercase"
  | "lowercase"
  | "titlecase_words"
  | "sentencecase";

export type LanguageMode =
  | "bg_hover_tr"
  | "tr_hover_bg"
  | "both_bg_first"
  | "both_tr_first"
  | "quiz_hide_secondary";

export type MarkerMode = "off" | "soft" | "strong";

export interface DisplayPreferences {
  scriptMode: ScriptMode;
  letterCaseMode: LetterCaseMode;
  languageMode: LanguageMode;
  markerMode: MarkerMode;
  showTransliteration: boolean;
  showPronunciation: boolean;
}

const defaultPreferences: DisplayPreferences = {
  scriptMode: "print",
  letterCaseMode: "sentencecase",
  languageMode: "bg_hover_tr",
  markerMode: "soft",
  showTransliteration: true,
  showPronunciation: true
};

interface DisplayPreferencesContextType {
  preferences: DisplayPreferences;
  updatePreferences: (newPrefs: Partial<DisplayPreferences>) => void;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextType | undefined>(undefined);

export function DisplayPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<DisplayPreferences>(() => {
    const saved = localStorage.getItem('displayPreferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('displayPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (newPrefs: Partial<DisplayPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  return (
    <DisplayPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences() {
  const context = useContext(DisplayPreferencesContext);
  if (!context) {
    throw new Error('useDisplayPreferences must be used within a DisplayPreferencesProvider');
  }
  return context;
}
