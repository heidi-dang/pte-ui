import { TaskCode } from '../../shared/questionTaskRegistry';

export interface GenerateBatchParams {
  requestKey: string;
  requestedByUserId: string;
  taskCode: TaskCode;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ReviewScore {
  score: number; // 0 - 100
  reasoning: string;
}

export interface GeneratorResult {
  questions: any[];
  promptTokens?: number;
  completionTokens?: number;
  provider?: string;
  model?: string;
}
