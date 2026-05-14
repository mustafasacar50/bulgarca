// Cyrillic to Latin transliteration map
const cyrToLat: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y',
  'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
  'ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'','ю':'yu','я':'ya',
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ж':'Zh','З':'Z','И':'I','Й':'Y',
  'К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U',
  'Ф':'F','Х':'H','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sht','Ъ':'A','Ь':'','Ю':'Yu','Я':'Ya'
};

export function cyrillicToLatin(text: string): string {
  return text.split('').map(c => cyrToLat[c] || c).join('');
}

// Levenshtein distance
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// Check if two strings differ only by a 2-char swap (transposition)
export function hasTransposition(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diffs: number[] = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs.push(i);
  }
  if (diffs.length !== 2) return false;
  const [i, j] = diffs;
  return a[i] === b[j] && a[j] === b[i];
}

export type MatchResult = 'exact' | 'close' | 'wrong';

export function matchAnswer(userInput: string, correct: string): MatchResult {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[!?.,;:\-–—()'"«»\s]+/g, '');
  const u = normalize(userInput);
  const c = normalize(correct);
  const cLat = normalize(cyrillicToLatin(correct));

  if (u === c || u === cLat) return 'exact';
  
  const dist = Math.min(levenshtein(u, c), levenshtein(u, cLat));
  if (dist <= 1 || hasTransposition(u, c) || hasTransposition(u, cLat)) return 'close';
  
  return 'wrong';
}
