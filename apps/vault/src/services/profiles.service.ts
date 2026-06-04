import { failureEnvelopeSchema, successEnvelopeSchema } from '@aida/contracts';
import { profilesRowSchema, type ProfilesRow } from '@aida/db';

import { getProfilesById, type ApiClient } from '@aida/api-client';
import { getApiGatewayClient } from '@/lib/api/gatewayClient';

const profileResponseSchema = successEnvelopeSchema(profilesRowSchema);

export type { ProfilesRow };

export class ProfilesService {
    static async getByAuthUserId(
        authUserId: string,
        api: ApiClient = getApiGatewayClient(),
    ): Promise<ProfilesRow> {
        const { data, error, response } = await getProfilesById({
            client: api,
            path: { id: authUserId },
        });

        if (!response.ok) {
            const body = error ?? (await response.json());
            const parsed = failureEnvelopeSchema.safeParse(body);

            if (parsed.success) {
                throw new Error(parsed.data.error.message);
            }

            throw new Error('Failed to load user profile');
        }

        const parsed = profileResponseSchema.parse(data);

        return parsed.data;
    }
}
