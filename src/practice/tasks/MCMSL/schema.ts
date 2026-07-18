import { z } from 'zod';

export const mcmslQuestionSchema = z.object({
  audioUrl: z.string().min(1),
  optionsJson: z.array(z.string()).min(2),
});

export const mcmslResponseSchema = z.object({
  selectedMultiple: z.array(z.string()).min(1),
});
