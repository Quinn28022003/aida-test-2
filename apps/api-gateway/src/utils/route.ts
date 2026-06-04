import { paginationQuerySchema } from '@aida/contracts';
import { ApiError } from '@aida/api-client/http';

import { getUserClaims } from '../supabase/context';

type UserClaimsContext = Parameters<typeof getUserClaims>[0];

/** Returns the authenticated Supabase user id or throws the route-level auth error. */
export function getRequiredUserClaimsId(c: UserClaimsContext) {
    const claimsId = getUserClaims(c)?.id;

    if (!claimsId) {
        throw ApiError.unauthenticated();
    }

    return claimsId;
}

/** Parses list pagination query params and converts them to an inclusive range. */
export function parseListPagination(requestUrl: string) {
    const queryParams = paginationQuerySchema.parse(
        Object.fromEntries(new URL(requestUrl).searchParams.entries()),
    );
    const page = queryParams.page ?? 1;
    const pageSize = queryParams.page_size ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return { page, pageSize, from, to };
}
