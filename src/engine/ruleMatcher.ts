import { Rule } from '../types/rule';

export function matchRules(text: string, rules: Rule[]): Rule[] {
  return rules.filter(rule => {
    // Simple pattern matching for MVP
    // Can be improved to use regex if pattern is defined as regex
    return text.includes(rule.pattern.split('→')[0].trim());
  });
}
