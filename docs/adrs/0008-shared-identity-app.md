# ADR 0008: Shared Identity App

## Status

Accepted

## Context

AIDA has multiple browser apps in the same product ecosystem, starting with Chat and Vault. Each app needs authenticated Supabase sessions before it can call secured API Gateway routes with `credentials: 'include'`.

The original auth screens lived inside product apps. That made login, registration, password reset, invite entry, auth copy, redirect handling, and Supabase browser auth wiring easy to duplicate. As more apps are added, that duplication would create avoidable drift:

- users may need to sign in through different product apps even though they are using the same AIDA account;
- auth flows can behave slightly differently between apps;
- password reset and invite links need to know which app owns the auth route;
- each new app has to repeat the same Supabase auth UI and redirect rules.

Supabase SSR auth persists browser sessions in `sb-*` cookies. Browser requests from product apps can then send those cookies to the API Gateway, where the gateway bridges the cookie access token to bearer credentials and verifies it with `@supabase/server` and JWKS. This means AIDA does not need separate auth implementations per product app; it needs one consistent place where users establish the shared Supabase session.

## Decision

Create `apps/identity` as the shared authentication app for the AIDA ecosystem.

Identity owns browser auth flows:

- login;
- registration;
- password reset request;
- password update;
- invite entry;
- post-auth redirect validation.

Product apps redirect unauthenticated users to Identity instead of rendering local auth forms. Identity signs users in with the same Supabase project and publishable key used by the product apps. Once Supabase writes the session cookies, users can return to Chat, Vault, or another allowed app and continue without signing in again.

Identity accepts a full `returnTo` URL and only redirects to origins explicitly allowed by configuration. When `returnTo` is missing, malformed, or points to an untrusted origin, Identity falls back to Chat home. This keeps the flow simple while avoiding open redirects.

Local development uses `apps/identity` on port `3006`. Chat and Vault keep thin legacy auth routes that redirect to Identity so existing `/login`, `/register`, reset, and invite links do not break immediately.

## Consequences

- Users sign in once for the AIDA ecosystem instead of signing in separately per app.
- Auth UI, Supabase browser auth calls, password reset handling, and post-auth redirect policy live in one app.
- New product apps can join the ecosystem by redirecting to Identity and sharing the same Supabase project cookie model.
- Product apps still keep their own Supabase browser clients for reading session state and signing out, but they no longer own primary sign-in and registration screens.
- API Gateway behaviour stays unchanged: product apps call it with `Authorization: Bearer <access_token>` from `supabase.auth.getSession()`.
- Deployments must ensure Identity and product apps can share Supabase cookies. On localhost, different ports share the `localhost` host. In production, apps on different subdomains need compatible Supabase cookie domain settings for the shared parent domain.
- Identity must keep an allowlist for post-auth redirect origins to prevent open redirects.
- Existing product auth routes become compatibility redirects and can be removed later only after links, bookmarks, emails, and docs no longer depend on them.

## Alternatives considered

| Alternative | Why not chosen |
| --- | --- |
| Keep auth forms in every product app | Duplicates UI and Supabase auth logic; each new app repeats redirect, reset, and invite handling; users experience app-specific sign-in flows. |
| Move only UI components into `packages/ui` | Reuses form rendering but still leaves each app responsible for auth side effects, cookie creation, redirects, and edge cases. |
| Put auth endpoints in API Gateway only | The gateway should verify and authorise API requests, not own browser auth screens or Supabase client-side session creation. |
| Use unrestricted `returnTo` redirects | Simpler implementation, but unsafe because external sites could use Identity as an open redirect after sign-in. |
