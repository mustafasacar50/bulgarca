export interface VocabularyItem {
  bg: string;
  tr: string;
  pronunciation?: string;
  plural?: string;
  note?: string;
  example?: string;
  ruleId?: string;
  gender?: string;
  notes_tr?: string;
}

export interface LessonBlock {
  type: 'explanation' | 'vocabulary' | 'image' | 'alphabet_grid' | 'rule_cards' | 'alphabet_grid_v2' | 'rule_cards_v2' | 'plural_rule_cards' | 'word_table_v2' | 'phrase_cards' | 'dialog_cards' | 'grammar_panel' | 'study_tip' | 'text' | 'alphabet_cards' | 'conversion_rule_grid' | 'plural_rule_grid' | 'dialogue' | 'grammar_table' | 'word_table' | 'exercise_preview' | 'phrases' | 'glossary_table' | 'writing_template' | 'writing_practice' | 'visual_card_reference';
  text_tr?: string;
  title_tr?: string;
  description_tr?: string;
  items?: any[];
  entries?: any[];
  rules?: any[];
  rule_ids?: string[];
  imageUrl?: string;
}

export interface LessonSection {
  section_id: string;
  title_tr: string;
  blocks: LessonBlock[];
}

export interface Lesson {
  lesson_id: string;
  title_tr: string;
  title_bg?: string;
  level: string;
  summary_tr?: string;
  ui_hints?: {
    default_show_marker?: boolean;
    supports_handwriting_toggle?: boolean;
    supports_right_panel?: boolean;
    supports_example_drawer?: boolean;
  };
  sections: LessonSection[];
}

export interface LessonMeta {
  id: string;
  title_tr: string;
  summary_tr?: string;
  description?: string;
  level: string;
  path: string;
  exercise_path?: string;
  order?: number;
}
