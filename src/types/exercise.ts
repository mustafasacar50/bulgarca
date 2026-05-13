export interface Question {
  type: 'multiple-choice' | 'fill-in-the-blank' | 'matching';
  question: string;
  options?: string[];
  answer: string | string[];
}

export interface ExerciseSet {
  lessonId: string;
  questions: Question[];
}
