import { profilesRowSchema } from '@aida/db';
import { z } from 'zod';

/** Validates `:id` on GET /profiles/:id (Supabase auth user id from the client). */
export const profileByIdParamsSchema = z.object({
    id: profilesRowSchema.shape.authUserId,
});

export type ProfileByIdParams = z.infer<typeof profileByIdParamsSchema>;
