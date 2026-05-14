import React from 'react';
import { Rule } from '../types/rule';
import { RuleTooltip } from './RuleTooltip';

interface HighlightedTextProps {
  text: string;
  rules: Rule[];
  onRuleClick?: (rule: Rule) => void;
}

export function HighlightedText({ text, rules, onRuleClick }: HighlightedTextProps) {
  // This is a simple implementation. In a real app, we'd use regex to find all rule patterns.
  // For MVP, we'll just check if the text matches any rule pattern.
  
  let content: React.ReactNode = text;
  
  // Sort rules by pattern length descending to match longest patterns first
  const sortedRules = [...rules].sort((a, b) => {
    const aLen = typeof a.pattern === 'string' ? a.pattern.length : (a.pattern as any).source_fragment?.length || 0;
    const bLen = typeof b.pattern === 'string' ? b.pattern.length : (b.pattern as any).source_fragment?.length || 0;
    return bLen - aLen;
  });
  
  // For demonstration, we just wrap the whole text if it matches a specific rule
  // Real implementation would split the text and wrap parts.
  
  return (
    <span className="leading-relaxed">
      {text}
    </span>
  );
}
