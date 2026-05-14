import { DisplaySettings } from '../state/DisplaySettingsContext';

export function formatBulgarianText(text: string, settings: DisplaySettings): string {
  if (!text) return "";
  
  let formatted = text;

  // Handle casing
  switch (settings.letterCaseMode) {
    case "normal":
      // Keep as is
      break;
    case "uppercase":
      formatted = formatted.toUpperCase();
      break;
    case "lowercase":
      formatted = formatted.toLowerCase();
      break;
    case "titlecase":
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

export function getScriptClass(settings: DisplaySettings): string {
  return settings.scriptMode === "handwriting" ? "font-handwriting" : "";
}

export function transliterateCyrillic(text: string): string {
  if (!text) return "";
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}
