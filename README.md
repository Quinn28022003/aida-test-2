# AIDA - AI Data Assistant

AIDA is a privacy-first AI assistant platform that helps users manage, query, and interact with their personal data through natural language conversations.

## Overview

AIDA consists of:

- **Chat App** (`apps/chat`): Next.js web application for user conversations with AI
- **Vault App** (`apps/vault`): Secure data management and storage interface
- **API Gateway** (`apps/api-gateway`): Central API routing and authentication
- **Background Service** (`apps/background-service`): Async task processing and RAG pipelines

## Architecture

See [docs/architecture-index.md](docs/architecture-index.md) for architecture navigation and [docs/backend-architecture.md](docs/backend-architecture.md) for the current frontend to backend to database flow.

## Monorepo Structure

This is a Turborepo monorepo with pnpm workspaces:

```
apps/
  api-gateway/        # API gateway service
  background-service/ # Background job processor
  chat/               # Next.js chat application
  vault/              # Next.js vault application

packages/
  agents/             # AI agent definitions and orchestration
  api-client/         # API client, RPC types, and response helpers
  auth/               # Authentication and authorisation
  config/             # Shared configuration
  contracts/          # API contracts and types
  conversations/      # Conversation management
  db/                 # Database schemas and clients
  events/             # Event bus and messaging
  permissions/        # Permission system
  rag/                # Retrieval-Augmented Generation
  storage/            # File storage abstractions
  tasks/              # Background task definitions
  tools/              # AI tool definitions
  ui/                 # Shared UI components
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase cloud dev project access

### Install Dependencies

```sh
pnpm install
```

### Development

Run all apps in development mode:

```sh
pnpm dev
```

Or run specific apps:

```sh
pnpm dev --filter=chat
pnpm dev --filter=api-gateway
```

### Build

```sh
pnpm build
```

### Test

Run all workspace tests with the root test command. Use Turbo filters directly when you want one app, package, or group. See [Monorepo guide — Running tests](docs/monorepo.md#running-tests) for the full target table.

```sh
pnpm test
pnpm turbo run test --filter=@aida/chat
pnpm turbo run test --filter=./packages/*
pnpm turbo run test --filter=./apps/*
```

### Lint

```sh
pnpm lint
```

## Environment Setup

Copy each app’s `.env.example` into a local `.env` in the same directory (values are per-app, not shared from the repo root):

```sh
cp apps/chat/.env.example apps/chat/.env
cp apps/vault/.env.example apps/vault/.env
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/background-service/.env.example apps/background-service/.env
```

Chat and Vault use `NEXT_PUBLIC_*` keys validated by `@aida/config/public`. API Gateway and Background Service use `@aida/config/server` and `@aida/config/worker`. Align chat `NEXT_PUBLIC_API_GATEWAY_URL` with api-gateway `PORT`, and match `NEXT_PUBLIC_SUPABASE_*` to api-gateway `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`. The gateway verifies user access tokens with Supabase JWKS (`withSupabase` user mode) — not `SUPABASE_JWT_SECRET`. Run frontend dev via the monorepo (`pnpm dev` or `pnpm --filter @aida/chat dev`) so `dotenv -- next dev` loads the app `.env`. Restart processes after env changes. See [packages/config/README.md](packages/config/README.md) and [docs/operations.md — API Gateway authentication](docs/operations.md#api-gateway-authentication-supabase-user-jwt).

## Database Workflow (Cloud Dev)

Use SQL migrations in `supabase/migrations` as the source of truth. One-time setup: `pnpm exec supabase login` and `pnpm exec supabase link` (see [docs/db-schema.md](docs/db-schema.md)).

```sh
pnpm db prepare
```

Or step by step: `pnpm db migrate new <name>`, `pnpm db migrate up`, `pnpm rls sync`, `pnpm db validate` (see [docs/db-schema.md](docs/db-schema.md)).

Run `pnpm run help` for the full CLI entry menu (`db`, `rls`, `api`, `test`). (`pnpm help` is reserved by the pnpm CLI itself.)

## Documentation

- [Architecture](docs/architecture.md)
- [Operations (env, API Gateway auth, troubleshooting)](docs/operations.md)
- [ADR 0004: API Gateway auth (`@supabase/server`, JWT Signing Keys)](docs/adrs/0004-api-gateway-supabase-server-auth.md)
- [Database Schema Workflow](docs/db-schema.md)
- [ADR 0006: Internal Database CLI (`pnpm db` / `rls`)](docs/adrs/0006-internal-database-cli.md)
- [Monorepo Guide](docs/monorepo.md)
- [Foundation scope](docs/foundation-scope.md)

## License

Private - All rights reserved.
