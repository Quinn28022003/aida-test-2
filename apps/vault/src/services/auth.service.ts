import { buildIdentityLoginRedirect, redirectToExternalUrl } from '@/lib/auth/identityRedirect';
import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

export class AuthService {
    static async signOut(): Promise<void> {
        await getSupabaseClient().auth.signOut();
        redirectToExternalUrl(buildIdentityLoginRedirect(`${window.location.origin}/`));
    }
}
