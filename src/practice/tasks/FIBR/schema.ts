import { z } from 'zod';

export const fibrQuestionSchema = z.object({
  promptText: z.string().min(1),
  optionsJson: z.array(z.string()).min(1),
});

export const fibrResponseSchema = z.object({
  blanks: z.record(z.string(), z.string()),
});
