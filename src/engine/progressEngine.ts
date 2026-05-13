import { UserProgress, LessonState } from '../types/progress';
import { storage } from './storage';

export const progressEngine = {
  getProgress: (): UserProgress => {
    const defaultProgress: UserProgress = {
      completedLessons: [],
      stats: { wordsLearned: 0, exercisesDone: 0, streak: 1 }
    };
    return storage.get<UserProgress>('user_progress') || defaultProgress;
  },

  saveProgress: (progress: UserProgress) => {
    storage.set('user_progress', progress);
  },

  completeLesson: (lessonId: string) => {
    const progress = progressEngine.getProgress();
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progressEngine.saveProgress(progress);
    }
  }
};
