import React from 'react';
import type { PTETaskCode, PTESection, PracticeItem } from '../../types';

export type TimerPhase = 
  | 'idle'
  | 'preparing'
  | 'prompt_playing'
  | 'recording'
  | 'answering'
  | 'expired'
  | 'submitted'
  | 'completed'
  | 'failed';

export interface RendererProps {
  item: PracticeItem;
  status: TimerPhase;
  theme: 'dark' | 'light';
  onAnswerChange: (data: any) => void;
}

export interface TaskModule {
  code: PTETaskCode;
  section: PTESection;
  Renderer: React.FC<RendererProps>;
  createInitialResponse: (question: PracticeItem) => any;
  normalizeResponse: (data: any) => any;
}
