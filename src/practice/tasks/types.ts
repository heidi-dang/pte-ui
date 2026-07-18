import React from 'react';
import { z } from 'zod';
import type { PTETaskCode, PTESection, PracticeItem } from '../../types';

export interface TimingPolicy {
  prepSeconds: number;
  responseSeconds: number;
  onePlayAudio: boolean;
}

export interface RendererProps {
  item: PracticeItem;
  status: 'preparing' | 'recording' | 'answering' | 'completed';
  theme: 'dark' | 'light';
  onAnswerChange: (data: Record<string, unknown>) => void;
}

export interface TaskModule {
  code: PTETaskCode;
  section: PTESection;
  timing: TimingPolicy;
  questionSchema: z.ZodType;
  responseSchema: z.ZodType;
  scoringStrategy: 'deterministic' | 'speech' | 'open_response';
  requiredAssets: ('audio' | 'image')[];
  Renderer: React.FC<RendererProps>;
}
