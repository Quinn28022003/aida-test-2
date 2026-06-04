import type { z } from 'zod';

import type {
    loginFormSchema,
    registerFormSchema,
    resetPasswordRequestFormSchema,
    resetPasswordUpdateFormSchema,
} from '../schemas';

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ResetPasswordRequestFormValues = z.infer<typeof resetPasswordRequestFormSchema>;
export type ResetPasswordUpdateFormValues = z.infer<typeof resetPasswordUpdateFormSchema>;
