import { VocabularyItem } from '../types/lesson';
import { Question } from '../types/exercise';

export const exerciseGenerator = {
  generateFromVocabulary: (items: VocabularyItem[]): Question[] => {
    return items.map(item => {
      // Create random options
      const otherItems = items.filter(i => i.bg !== item.bg);
      const options = [item.tr, ...otherItems.map(i => i.tr).slice(0, 2)].sort(() => Math.random() - 0.5);
      
      return {
        type: 'multiple-choice',
        question: `'${item.bg}' kelimesinin Türkçe karşılığı nedir?`,
        options,
        answer: item.tr
      };
    });
  }
};
