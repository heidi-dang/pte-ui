import { z } from 'zod';

export const weQuestionSchema = z.object({
  promptText: z.string().min(1),
});

export const weResponseSchema = z.object({
  typedText: z.string().min(1),
});
