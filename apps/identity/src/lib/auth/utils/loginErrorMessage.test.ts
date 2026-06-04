import { describe, expect, it } from 'vitest';

import { getLoginErrorMessage } from './loginErrorMessage';

describe('getLoginErrorMessage', () => {
    it('maps invalid credential messages to a generic sign-in failure', () => {
        expect(getLoginErrorMessage('Invalid login credentials')).toBe(
            'Incorrect email or password.',
        );
        expect(getLoginErrorMessage('Invalid email or password')).toBe(
            'Incorrect email or password.',
        );
    });

    it('maps other errors to a generic system message', () => {
        expect(getLoginErrorMessage('Network request failed')).toBe(
            'Something went wrong. Please try again.',
        );
    });
});
