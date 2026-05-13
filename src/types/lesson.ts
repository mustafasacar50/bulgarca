export interface LessonItem {
  type: 'text' | 'vocabulary' | 'image';
  value?: string;
  items?: VocabularyItem[];
  imageUrl?: string;
}

export interface VocabularyItem {
  bg: string;
  tr: string;
  pronunciation?: string;
  plural?: string;
  note?: string;
  example?: string;
  ruleId?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: LessonItem[];
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
