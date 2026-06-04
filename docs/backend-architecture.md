# Backend Architecture

This document describes the current backend request flow. Keep it as the short operational guide; ADRs should explain why decisions were made.

## Request Flow

```text
Frontend app
  -> @aida/api-client
  -> API Gateway secured route group
  -> Supabase auth middleware
  -> Route handler
  -> Composition factory
  -> Domain service
  -> Repository
  -> Supabase database
```

The important rule is simple: **repositories are the only application layer that talks to Supabase tables directly**. Routes, composition factories, and services pass the request-scoped Supabase client down to the repository.

## Frontend

`apps/identity` is the shared auth frontend: login, register, password reset, and invite entry. `apps/chat` and `apps/vault` redirect unauthenticated users to Identity (`NEXT_PUBLIC_IDENTITY_DOMAIN`) with a full `returnTo` URL; legacy `/login` and related routes on product apps only forward to Identity.

Identity signs users in with `@supabase/ssr` `createBrowserClient` so the browser session is stored in Supabase SSR cookies, not `localStorage`. Product apps keep their own Supabase browser clients for session reads via `supabase.auth.getSession()`; when Identity and product apps share a registrable domain (or `localhost` in local dev), the same `sb-*` cookies are available to Chat and Vault.

Browser services call the gateway through `@aida/api-client`, which attaches `Authorization: Bearer <access_token>` from `getSession()` before each request.

Profile fetch example (`apps/chat/src/services/profiles.service.ts`):

```ts
import { getProfilesById } from '@aida/api-client';
import { getApiGatewayClient } from '@/lib/api/gatewayClient';

const { data, error, response } = await getProfilesById({
    client: getApiGatewayClient(),
    path: { id: authUserId },
});
```

The browser can import frontend-safe packages such as `@aida/api-client`, `@aida/contracts`, `@aida/config/public`, and `@aida/ui`. It must not import gateway code, server config, repositories, or backend-only domain services.

### OpenAPI and typed client

Gateway route modules export `AppType` for `@rcmade/hono-docs`, which writes `internal.openapi.json` (all mounts) and `public.openapi.json` (`publicDocs: true` only). `@hey-api/openapi-ts` generates `packages/api-client/src/generated` from the **internal** file only; Chat and Vault import generated functions and pass a configured `client` from `getApiGatewayClient()`. Public Swagger lives at `GET /docs/public` on the gateway and does not drive the frontend SDK.

After route changes: `pnpm api generate` from the repo root and commit the updated specs plus generated client. See [Monorepo — API OpenAPI and client CLI](monorepo.md#api-openapi-and-client-cli) and [ADR 0009](adrs/0009-internal-vs-public-openapi.md).

## API Gateway Routes

Gateway route factories live in `apps/api-gateway/src/routes/`. They are responsible for HTTP concerns only:

- read route params, query, and body;
- validate inputs at the route boundary;
- get the Supabase client from the request context;
- call the domain composition factory;
- map domain errors to HTTP errors;
- return success or failure envelopes.

Profile route example:

```ts
const { id: authUserId } = profileByIdParamsSchema.parse({ id: c.req.param('id') });
const supabase = getUserSupabaseClient(c);
const profileUseCases = createProfileUseCases(supabase);
const profile = await profileUseCases.getByAuthUserId(authUserId);

return successJson(c, profile);
```

Routes should not run Supabase table queries directly. If a route needs data, add or use a service method and repository method in the relevant package.

## Supabase Middleware

Secured route groups are mounted through `createSecuredDomain()` in `apps/api-gateway/src/app/secured-domain.ts`. Domain middleware comes from `API_APP_WIRING.domainWrapper.middleware` and currently includes Supabase auth.

`createSupabaseAuthMiddleware()` uses `@supabase/server` `createSupabaseContext({ auth: 'user', ...config })`. Per request it:

- verifies the `Authorization` bearer credentials using the project JWKS;
- creates a user-scoped Supabase client;
- attaches `supabaseContext` to the Hono context;
- requires `userClaims.id`, otherwise throws `ApiError.unauthenticated()`.

Routes read the request-scoped clients via helpers in `apps/api-gateway/src/supabase/context.ts`:

```ts
const supabase = getUserSupabaseClient(c);
const adminSupabase = getAdminSupabaseClient(c);
```

Use the user client by default so Row-Level Security applies. Use the admin client only for explicit server-side privileged operations.

## Composition

Composition factories live in `apps/api-gateway/src/composition/`. They connect the gateway to package-level domain building blocks. There is no dependency injection container.

Profile composition example:

```ts
export function createProfileUseCases(supabase: TypedSupabaseClient) {
    const profileRepository = new SupabaseProfilesRepository();

    return new ProfileUseCaseService(supabase, profileRepository);
}
```

Composition should stay boring:

- receive the request-scoped Supabase client;
- instantiate repositories and services;
- pass dependencies explicitly;
- avoid global mutable state.

## Domain Services

Services live in domain packages, for example `packages/profiles/src/services.ts`. A service is a use-case layer. It may orchestrate repositories, enforce business rules, convert data, and throw domain errors.

Profile service example:

```ts
export class ProfileUseCaseService {
    constructor(
        private readonly supabase: ProfilesSupabaseClient,
        private readonly repository: SupabaseProfilesRepository,
    ) {}

    async getByAuthUserId(authUserId: string): Promise<ProfilesRow> {
        const profile = await this.repository.getByAuthUserId(this.supabase, authUserId);

        if (!profile) {
            throw new ProfileNotFoundError(authUserId);
        }

        return parseDatabaseRow(profile, profilesRowSchema);
    }
}
```

Services should not call `supabase.from(...)` directly. They pass the Supabase client to repositories.

## Repositories

Repositories live in domain packages, for example `packages/profiles/src/repositories.ts`. They are the data access layer and the only place application code should execute Supabase table queries.

Profile repository example:

```ts
export class SupabaseProfilesRepository {
    async getByAuthUserId(
        supabase: ProfilesSupabaseClient,
        authUserId: string,
    ): Promise<ProfileRow | null> {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return profile;
    }
}
```

Repositories should stay thin:

- receive the Supabase client as a method parameter;
- query tables, RPCs, or storage;
- return raw database rows or low-level results;
- avoid business decisions and response shaping.

## Database

Supabase Postgres is the source of truth. Schema changes start as SQL migrations under `supabase/migrations/`, then generated types and Zod schemas flow into `@aida/db`. Runtime validators use `information_schema` on the applied database so `uuid` and `timestamptz` columns validate stricter than Supabase TypeScript alone — see [ADR 0007](adrs/0007-supabase-generated-zod-schemas.md).

Runtime access control is enforced by Supabase Row-Level Security. Frontend checks and route checks may improve UX or fail early, but they do not replace database policies.

## Layer Rules

```text
apps/chat, apps/vault
  -> @aida/api-client
  -> apps/api-gateway secured route group
  -> apps/api-gateway route handler
  -> apps/api-gateway composition
  -> packages/<domain>/services
  -> packages/<domain>/repositories
  -> Supabase
```

Keep new backend work aligned with these rules:

- validate inputs at route and service boundaries;
- pass Supabase from request context through composition and services into repositories;
- keep direct database access inside repositories;
- keep package exports simple and public types in sibling `.types.ts` files when the package has a meaningful public type surface;
- update this document or an ADR when the flow changes.
