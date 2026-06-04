import { createDomainErrorClass } from '@aida/contracts';

export const ProfileNotFoundError = createDomainErrorClass<[authUserId: string]>({
    name: 'ProfileNotFoundError',
    create: (authUserId) => ({
        message: 'Profile not found',
        details: { authUserId },
    }),
});
