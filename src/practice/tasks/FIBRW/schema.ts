import { z } from 'zod';

export const fibrwQuestionSchema = z.object({
  promptText: z.string().min(1),
  optionsJson: z.array(z.string()).min(1),
});

export const fibrwResponseSchema = z.object({
  blanks: z.record(z.string(), z.string()),
});
