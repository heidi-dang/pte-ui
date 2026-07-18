import { z } from 'zod';

export const ropQuestionSchema = z.object({
  optionsJson: z.array(z.string()).min(2),
});

export const ropResponseSchema = z.object({
  reorderedList: z.array(z.string()).min(2),
});
