import { z } from 'zod';

export const wfdQuestionSchema = z.object({
  audioUrl: z.string().min(1),
});

export const wfdResponseSchema = z.object({
  typedText: z.string().min(1),
});
