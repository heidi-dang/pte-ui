import { z } from 'zod';

export const sstQuestionSchema = z.object({
  audioUrl: z.string().min(1),
});

export const sstResponseSchema = z.object({
  typedText: z.string().min(1),
});
