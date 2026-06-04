# @aida/contracts

Shared API and domain contracts for AIDA.

Contracts must stay serialisable and safe to import from backend and frontend code. This package is runtime-agnostic and must not depend on app packages, database clients, cloud SDKs, React components, or backend service packages.

## Purpose

This package is the source of truth for:

- model provider request, result, metadata, error, usage, and stream event shapes
- authorisation permission keys, role definitions, and table-level RLS policy config metadata
- table name constants used by authz contracts and RLS generation
- frontend-safe cross-domain DTOs and collaborator port types used between backend domains

Model provider contracts live here so API Gateway, Chat, and backend runtime packages can agree on stream event shapes without importing AWS or Mastra runtime code.

The `authz` module is used by RBAC seed data, RLS SQL generation, and application checks. Import keys from this package instead of hardcoding permission strings.

## Public exports

The package exports from `src/index.ts`.

### Model contracts

- `ModelProvider`
- `ModelProfileKind`
- `ModelProfileMode`
- `ModelProfile`
- `ModelMessageRole`
- `ModelMessage`
- `ModelRequest`
- `ModelUsage`
- `ModelFinishReason`
- `ModelProviderMetadata`
- `ModelProviderError`
- `ModelInvokeResult`
- `ModelStreamEvent`

### Authz contracts

- `PERMISSIONS_OBJECT`
- `PERMISSIONS`
- `ROLES`
- `ERole`
- `ERoleScope`
- `ERlsCheckType`
- `TABLE_RLS_POLICY_CONFIG`
- `TABLES`
- `parsePermissionKey`
- `READ_PERMISSION_KEYS`
- `PermissionKeys`
- `PermissionDefinition`
- `RoleDefinition`
- `TableRlsPolicyConfig`
- `TableName`

### Domain collaboration contracts

Domain contracts now live directly under `src/<domain>/` and are split into:

- `types.ts` for frontend-safe DTOs and input/output shapes
- `interfaces.ts` for service/repository interfaces that backend domains implement

Current domain modules include:

- `profiles`
- `organizations`
- `projects`
- `agents`

Typical examples:

- `/me` DTOs such as `TMeContext` and `TMeMemberships`
- domain DTOs such as `TOrganization`, `TProject`, `TJob`, `TAgentMembership`
- service/repository interfaces such as `IProfilesService`, `IOrganizationsService`, `IProjectsRepository`, and `IAgentsService`

Consumers should import from the root package:

- `@aida/contracts`

## Forbidden imports

- App packages from `apps/*`.
- Runtime SDK clients.
- Database clients, including `@aida/db`.
- AWS SDKs.
- React components.
- Backend service packages.
- Environment-specific modules.

## Owner

- Platform / Contracts maintainers.
