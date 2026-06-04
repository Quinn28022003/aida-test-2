import { describe, expect, it } from 'vitest';

import { profileByIdParamsSchema } from './profileByIdParams';

describe('profileByIdParamsSchema', () => {
    it('accepts a valid auth user id', () => {
        const id = 'aa0e8400-e29b-41d4-a716-446655440001';

        expect(profileByIdParamsSchema.parse({ id })).toEqual({ id });
    });

    it('rejects missing id', () => {
        const result = profileByIdParamsSchema.safeParse({});

        expect(result.success).toBe(false);
    });
});
