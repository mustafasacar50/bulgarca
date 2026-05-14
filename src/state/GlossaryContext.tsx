import React, { createContext, useContext, useState, useEffect } from 'react';

export interface GlossaryEntry {
  entry_id: string;
  bg: string;
  tr: string;
  type?: string;
  status?: string;
  source_page?: number;
  markers?: any[];
  [key: string]: any;
}

interface GlossaryContextType {
  lookup: (bgText: string) => GlossaryEntry | null;
  entries: GlossaryEntry[];
  isLoading: boolean;
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [glossary, setGlossary] = useState<Record<string, GlossaryEntry>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGlossaries() {
      try {
        const manifestRes = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`);
        const manifest = await manifestRes.json();
        
        const paths = manifest.glossaries || (manifest.glossary ? [manifest.glossary] : []);
        
        const responses = await Promise.all(
          paths.map((p: string) => fetch(`${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`).then(r => r.json()))
        );

        const combined: Record<string, GlossaryEntry> = {};
        responses.forEach(data => {
          const entries = Array.isArray(data) ? data : (data.entries || []);
          entries.forEach((entry: GlossaryEntry) => {
            // We store by lowercase BG to make lookup easier
            if (entry.bg) {
              combined[entry.bg.toLowerCase()] = entry;
            }
          });
        });

        setGlossary(combined);
      } catch (error) {
        console.error('Glossary loading error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGlossaries();
  }, []);

  const lookup = (bgText: string) => {
    if (!bgText) return null;
    return glossary[bgText.toLowerCase()] || null;
  };

  const entriesArray = React.useMemo(() => Object.values(glossary), [glossary]);
  
  return (
    <GlossaryContext.Provider value={{ lookup, entries: entriesArray, isLoading }}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary() {
  const context = useContext(GlossaryContext);
  if (context === undefined) {
    throw new Error('useGlossary must be used within a GlossaryProvider');
  }
  return context;
}
