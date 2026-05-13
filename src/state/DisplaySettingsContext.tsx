import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { storage } from '../engine/storage';
import { loadUserDataFile, saveUserDataFile } from '../engine/githubSync';
import { GitHubConfig } from '../types/sync';

export type ScriptMode = "print" | "handwriting";

export type LetterCaseMode =
  | "normal"
  | "uppercase"
  | "lowercase"
  | "titlecase"
  | "sentencecase";

export type LanguageMode =
  | "bg_hover_tr"
  | "tr_hover_bg"
  | "bg_tr"
  | "quiz_hidden";

export type MarkerMode = "off" | "subtle" | "strong";

export interface DisplaySettings {
  scriptMode: ScriptMode;
  letterCaseMode: LetterCaseMode;
  languageMode: LanguageMode;
  markerMode: MarkerMode;
  showTransliteration: boolean;
  showPronunciation: boolean;
}

const defaultSettings: DisplaySettings = {
  scriptMode: "print",
  letterCaseMode: "normal",
  languageMode: "bg_hover_tr",
  markerMode: "strong",
  showTransliteration: true,
  showPronunciation: true
};

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSettings: (newSettings: Partial<DisplaySettings>) => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('displaySettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const remoteSettingsRef = useRef<string>("");
  const isSavingRef = useRef(false);

  // Sync with GitHub on mount
  useEffect(() => {
    async function syncWithGithub() {
      const token = storage.get<string>('github_token') || storage.get<string>('github_token', true);
      if (token) {
        const config: GitHubConfig = { 
          token, 
          owner: 'mustafasacar50', 
          repo: 'bulgarca-user-data', 
          branch: 'main' 
        };
        
        try {
          const remoteSettings = await loadUserDataFile<DisplaySettings>(config, 'lesson-state.json');
          if (remoteSettings) {
            const settingsStr = JSON.stringify(remoteSettings);
            remoteSettingsRef.current = settingsStr;
            setSettings(remoteSettings);
            localStorage.setItem('displaySettings', settingsStr);
          } else {
            remoteSettingsRef.current = JSON.stringify(settings);
          }
        } catch (e) {
          console.error('Remote settings sync failed:', e);
        }
      }
      setIsLoaded(true);
    }
    syncWithGithub();
  }, []);

  useEffect(() => {
    const settingsStr = JSON.stringify(settings);
    localStorage.setItem('displaySettings', settingsStr);
    
    // Only save to GitHub if we have finished the initial load/sync
    // and the settings have actually changed from what we last loaded/saved
    if (!isLoaded || isSavingRef.current) return;
    if (settingsStr === remoteSettingsRef.current) return;

    const token = storage.get<string>('github_token') || storage.get<string>('github_token', true);
    if (token) {
      const config: GitHubConfig = { 
        token, 
        owner: 'mustafasacar50', 
        repo: 'bulgarca-user-data', 
        branch: 'main' 
      };
      
      const timer = setTimeout(async () => {
        isSavingRef.current = true;
        try {
          await saveUserDataFile(config, 'lesson-state.json', settings);
          remoteSettingsRef.current = JSON.stringify(settings);
        } catch (err: any) {
          if (!err.message?.includes('409') && !err.message?.includes('conflict')) {
            console.error('Failed to save settings to GitHub:', err);
          }
        } finally {
          isSavingRef.current = false;
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <DisplaySettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
}
