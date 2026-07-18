import { z } from 'zod';

export const asqQuestionSchema = z.object({
  audioUrl: z.string().min(1),
});

export const asqResponseSchema = z.object({
  audioRecorded: z.boolean(),
});
