import { z } from 'zod';

export const rlQuestionSchema = z.object({
  audioUrl: z.string().min(1),
});

export const rlResponseSchema = z.object({
  audioRecorded: z.boolean(),
});
