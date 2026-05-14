export interface Rule {
  id: string;
  rule_id?: string; // Some data uses rule_id
  category?: string;
  title?: string;
  title_tr?: string;
  short_tr?: string;
  description?: string;
  description_tr?: string;
  summary_tr?: string;
  tooltip_tr?: string;
  pattern: string | {
    source_lang?: string;
    target_lang?: string;
    source_fragment?: string;
    target_fragment?: string;
    match_type?: string;
    position?: string;
  };
  marker?: {
    color_key?: string;
    highlight_source?: string;
    highlight_target?: string;
    style?: string;
  };
  panel_tr?: {
    summary?: string;
    details?: string[];
    practice_hint?: string;
  };
  examples: {
    bg: string;
    tr: string;
    display?: string;
    plural?: string;
    bg_singular?: string;
    bg_plural?: string;
    rule_marks?: any;
    source?: {
      source_id?: string;
      page?: number;
    };
  }[];
  source_refs?: any[];
}

export interface RuleSet {
  id: string;
  title: string;
  rules: Rule[];
}
