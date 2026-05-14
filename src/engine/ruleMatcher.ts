import { Rule } from '../types/rule';

export interface PairMarker {
  rule_id: string;
  color_key: string;
  tr_fragment?: string;
  bg_fragment?: string;
  tr_start?: number;
  tr_end?: number;
  bg_start?: number;
  bg_end?: number;
  tooltip_tr?: string;
  score?: number; // Higher score takes precedence
}

export function findPairMarkers(params: {
  tr?: string;
  bg?: string;
  ruleRefs?: string[];
  rules: Rule[];
  entryRuleMarks?: any[];
}): PairMarker[] {
  const { tr, bg, ruleRefs, rules, entryRuleMarks } = params;
  if (!tr || !bg) return [];
  
  const trUpper = tr.toUpperCase();
  const bgLower = bg.toLowerCase();
  
  let markers: PairMarker[] = [];

  // 1. If entry has explicit rule_marks, use them (Highest priority)
  if (entryRuleMarks && entryRuleMarks.length > 0) {
    return entryRuleMarks.map(m => ({
      ...m,
      rule_id: m.rule_id || 'explicit',
      score: 100
    }));
  }

  // 2. Discovery
  rules.forEach(rule => {
    const ruleId = rule.rule_id || rule.id;
    let matchFound = false;

    // Check if this rule is explicitly referenced
    const isExplicitlyRefed = ruleRefs?.includes(ruleId);
    const autoApply = (rule as any).auto_apply !== false;

    // A. Check if the word pair is in the rule's examples with rule_marks
    if (rule.examples && rule.examples.length > 0) {
      const exampleMatch = rule.examples.find(ex => 
        ex.tr?.toUpperCase() === trUpper && 
        ex.bg?.toLowerCase() === bgLower
      );
      
      if (exampleMatch && exampleMatch.rule_marks) {
        const em = exampleMatch.rule_marks;
        const trFrag = em.source_fragment || em.tr_fragment;
        const bgFrag = em.target_fragment || em.bg_fragment;
        
        const trIdx = trUpper.indexOf(trFrag?.toUpperCase() || "");
        const bgIdx = bgLower.indexOf(bgFrag?.toLowerCase() || "");

        if (trIdx !== -1 && bgIdx !== -1) {
          markers.push({
            rule_id: ruleId,
            color_key: rule.marker?.color_key || 'blue',
            tr_fragment: trFrag,
            bg_fragment: bgFrag,
            tr_start: trIdx,
            tr_end: trIdx + (trFrag?.length || 0),
            bg_start: bgIdx,
            bg_end: bgIdx + (bgFrag?.length || 0),
            tooltip_tr: rule.tooltip_tr || rule.title_tr,
            score: 90 // Exact example match
          });
          matchFound = true;
        }
      }
    }

    // B. Pattern-based discovery
    // Only auto-apply if allowed OR explicitly referenced
    if (!matchFound && (autoApply || isExplicitlyRefed) && rule.pattern && typeof rule.pattern !== 'string') {
      const p = rule.pattern as any;
      const trFrag = p.source_fragment;
      const bgFrag = p.target_fragment;

      if (trFrag && bgFrag) {
        const matchType = p.match_type || 'fragment';
        const isSuffix = matchType === 'suffix' || matchType === 'suffix_or_fragment';
        const isPrefix = matchType === 'prefix';
        
        const trIndex = isSuffix ? trUpper.lastIndexOf(trFrag.toUpperCase()) : trUpper.indexOf(trFrag.toUpperCase());
        const bgIndex = isSuffix ? bgLower.lastIndexOf(bgFrag.toLowerCase()) : bgLower.indexOf(bgFrag.toLowerCase());

        if (trIndex !== -1 && bgIndex !== -1) {
          const trIsAtEnd = trIndex + trFrag.length === tr.length;
          const bgIsAtEnd = bgIndex + bgFrag.length === bg.length;
          const trIsAtStart = trIndex === 0;
          const bgIsAtStart = bgIndex === 0;

          const validPosition = 
            (!isSuffix || (trIsAtEnd && bgIsAtEnd)) &&
            (!isPrefix || (trIsAtStart && bgIsAtStart));

          if (validPosition) {
            // Determine score based on rule category/type
            let score = 50; // Default
            if (isSuffix || isPrefix) score = 60;
            if (rule.category === 'phonetic_mapping' && !autoApply) score = 20; // Broad vowels
            if (rule.category === 'phonetic_mapping' && autoApply) score = 70; // Consonants

            markers.push({
              rule_id: ruleId,
              color_key: rule.marker?.color_key || 'blue',
              tr_fragment: trFrag,
              bg_fragment: bgFrag,
              tr_start: trIndex,
              tr_end: trIndex + trFrag.length,
              bg_start: bgIndex,
              bg_end: bgIndex + bgFrag.length,
              tooltip_tr: rule.tooltip_tr || rule.title_tr || `${trFrag} → ${bgFrag}`,
              score
            });
          }
        }
      }
    }
  });

  // 3. Filter overlapping markers
  // Sort by score DESC, then by length DESC
  markers.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.tr_fragment?.length || 0) - (a.tr_fragment?.length || 0));

  const finalMarkers: PairMarker[] = [];
  const occupiedTr = new Set<number>();
  const occupiedBg = new Set<number>();

  markers.forEach(m => {
    let overlap = false;
    for (let i = (m.tr_start || 0); i < (m.tr_end || 0); i++) {
      if (occupiedTr.has(i)) overlap = true;
    }
    for (let i = (m.bg_start || 0); i < (m.bg_end || 0); i++) {
      if (occupiedBg.has(i)) overlap = true;
    }

    if (!overlap) {
      finalMarkers.push(m);
      for (let i = (m.tr_start || 0); i < (m.tr_end || 0); i++) occupiedTr.add(i);
      for (let i = (m.bg_start || 0); i < (m.bg_end || 0); i++) occupiedBg.add(i);
    }
  });

  return finalMarkers;
}

export function matchRules(text: string, rules: Rule[]): Rule[] {
  return rules.filter(rule => {
    if (!rule.pattern) return false;
    // Handle both old string pattern and new object pattern
    if (typeof rule.pattern === 'string') {
        return text.includes(rule.pattern.split('→')[0].trim());
    }
    const sourceFrag = (rule.pattern as any).source_fragment;
    return text.toLowerCase().includes(sourceFrag?.toLowerCase() || "");
  });
}

export function getExamplesForLetter(letter: string, glossary: any[]): any[] {
  const l = letter.toLowerCase();
  return glossary.filter(item => 
    item.bg?.toLowerCase().includes(l) || 
    item.bg_singular?.toLowerCase().includes(l) ||
    item.bg_plural?.toLowerCase().includes(l) ||
    item.letter?.toLowerCase() === l
  );
}

export function getExamplesForRule(ruleId: string, glossary: any[], rules: Rule[]): any[] {
  return glossary.filter(item => {
    const markers = findPairMarkers({
      tr: item.tr || item.meaning_tr,
      bg: item.bg || item.bg_singular,
      ruleRefs: item.rule_refs,
      rules: rules,
      entryRuleMarks: item.rule_marks
    });
    return markers.some(m => m.rule_id === ruleId);
  });
}
