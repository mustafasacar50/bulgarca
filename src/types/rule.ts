export interface Rule {
  id: string;
  pattern: string;
  description: string;
  examples: {
    bg: string;
    tr: string;
    plural?: string;
  }[];
  title?: string;
}

export interface RuleSet {
  id: string;
  title: string;
  rules: Rule[];
}
