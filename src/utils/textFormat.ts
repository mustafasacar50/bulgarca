import { DisplayPreferences } from '../state/DisplayPreferencesContext';

export function formatBulgarianText(text: string, prefs: DisplayPreferences): string {
  if (!text) return "";
  
  let formatted = text;

  // Handle casing
  switch (prefs.letterCaseMode) {
    case "uppercase":
      formatted = formatted.toUpperCase();
      break;
    case "lowercase":
      formatted = formatted.toLowerCase();
      break;
    case "titlecase_words":
      formatted = formatted.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      break;
    case "sentencecase":
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
      break;
  }

  return formatted;
}

export function getScriptClass(prefs: DisplayPreferences): string {
  return prefs.scriptMode === "handwriting" ? "font-handwriting" : "";
}
