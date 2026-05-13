export interface VocabularyItem {
  bg: string;
  tr: string;
  pronunciation?: string;
  plural?: string;
  note?: string;
  example?: string;
  ruleId?: string;
}

export interface LessonBlock {
  type: 'explanation' | 'vocabulary' | 'image' | 'alphabet_grid' | 'rule_cards';
  text_tr?: string;
  items?: any[];
  rules?: any[];
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
  sections: LessonSection[];
}

export interface LessonMeta {
  id: string;
  title_tr: string;
  description?: string;
  level: string;
  path: string;
  exercise_path?: string;
  order?: number;
}
