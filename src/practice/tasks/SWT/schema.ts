import { z } from 'zod';

export const swtQuestionSchema = z.object({
  promptText: z.string().min(1),
});

export const swtResponseSchema = z.object({
  typedText: z.string().min(1),
});
