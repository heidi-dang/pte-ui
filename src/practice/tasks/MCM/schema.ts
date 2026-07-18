import { z } from 'zod';

export const mcmQuestionSchema = z.object({
  promptText: z.string().min(1),
  optionsJson: z.array(z.string()).min(2),
});

export const mcmResponseSchema = z.object({
  selectedMultiple: z.array(z.string()).min(1),
});
