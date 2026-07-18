import { z } from 'zod';

export const raQuestionSchema = z.object({
  promptText: z.string().min(1),
});

export const raResponseSchema = z.object({
  audioRecorded: z.boolean(),
});
