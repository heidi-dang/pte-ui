import { z } from 'zod';
import { generatedQuestionUnion } from '../../shared/questionTaskRegistry';

// We chunk in sizes of 5, so each call expects an array of exactly 5 generated items, or fewer if it's the remaining items
export const generatedBatchSchema = z.object({
  questions: z.array(generatedQuestionUnion).max(5),
});

export const SCHEMA_VERSION = '1.0.0';
