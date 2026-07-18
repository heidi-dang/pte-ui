import { z } from 'zod';

export const hiwQuestionSchema = z.object({
  audioUrl: z.string().min(1),
  promptText: z.string().min(1),
});

export const hiwResponseSchema = z.object({
  highlightedIncorrect: z.array(z.string()).min(1),
});
