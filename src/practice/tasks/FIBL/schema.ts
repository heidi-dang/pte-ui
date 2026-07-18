import { z } from 'zod';

export const fiblQuestionSchema = z.object({
  audioUrl: z.string().min(1),
  promptText: z.string().min(1),
});

export const fiblResponseSchema = z.object({
  blanks: z.record(z.string(), z.string()),
});
