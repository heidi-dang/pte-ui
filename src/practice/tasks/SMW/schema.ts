import { z } from 'zod';

export const smwQuestionSchema = z.object({
  audioUrl: z.string().min(1),
  optionsJson: z.array(z.string()).min(2),
});

export const smwResponseSchema = z.object({
  selectedOption: z.string().min(1),
});
