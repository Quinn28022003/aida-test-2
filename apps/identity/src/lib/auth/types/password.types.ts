export type PasswordStrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong';

export type PasswordRule = {
    test: (value: string) => boolean;
    message: string;
};
