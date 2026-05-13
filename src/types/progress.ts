export interface UserProgress {
  completedLessons: string[];
  lastAccessedLesson?: string;
  stats: {
    wordsLearned: number;
    exercisesDone: number;
    streak: number;
  };
}

export interface LessonState {
  [lessonId: string]: {
    completed: boolean;
    score?: number;
    lastDate?: string;
  };
}
