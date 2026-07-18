import { z } from 'zod';

export const mcsslQuestionSchema = z.object({
  audioUrl: z.string().min(1),
  optionsJson: z.array(z.string()).min(2),
});

export const mcsslResponseSchema = z.object({
  selectedOption: z.string().min(1),
});
