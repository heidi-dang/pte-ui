import { z } from 'zod';

export const mcsQuestionSchema = z.object({
  promptText: z.string().min(1),
  optionsJson: z.array(z.string()).min(2),
});

export const mcsResponseSchema = z.object({
  selectedOption: z.string().min(1),
});
