export interface ExerciseItem {
  id: string;
  type: 'multiple_choice' | 'fill_in_the_blank' | 'matching';
  prompt_tr: string;
  choices?: string[];
  answer: string | string[];
  explanation_tr?: string;
}

export interface ExerciseSet {
  lesson_id: string;
  exercise_set_id: string;
  title_tr: string;
  items: ExerciseItem[];
}
