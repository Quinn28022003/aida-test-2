/**
 * Maps Supabase sign-in errors to short, user-safe messages.
 * Avoids exposing raw provider strings or password policy hints on login.
 */
export function getLoginErrorMessage(message: string): string {
    const lower = message.toLowerCase();

    if (
        lower.includes('invalid login credentials') ||
        lower.includes('invalid email or password')
    ) {
        return 'Incorrect email or password.';
    }

    return 'Something went wrong. Please try again.';
}
