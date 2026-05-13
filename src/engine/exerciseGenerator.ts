import { VocabularyItem } from '../types/lesson';
import { ExerciseItem } from '../types/exercise';

export const exerciseGenerator = {
  generateFromVocabulary: (items: VocabularyItem[]): ExerciseItem[] => {
    return items.map((item, idx) => {
      // Create random options
      const otherItems = items.filter(i => i.bg !== item.bg);
      const choices = [item.tr, ...otherItems.map(i => i.tr).slice(0, 3)].sort(() => Math.random() - 0.5);
      
      return {
        id: `gen_${idx}`,
        type: 'multiple_choice',
        prompt_tr: `'${item.bg}' kelimesinin Türkçe karşılığı nedir?`,
        choices,
        answer: item.tr
      };
    });
  }
};
