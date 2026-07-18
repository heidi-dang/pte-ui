import { z } from 'zod';

export const rsQuestionSchema = z.object({
  audioUrl: z.string().min(1),
});

export const rsResponseSchema = z.object({
  audioRecorded: z.boolean(),
});
