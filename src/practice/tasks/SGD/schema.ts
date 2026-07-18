import { z } from 'zod';

export const sgdQuestionSchema = z.object({
  audioUrl: z.string().min(1),
});

export const sgdResponseSchema = z.object({
  audioRecorded: z.boolean(),
});
