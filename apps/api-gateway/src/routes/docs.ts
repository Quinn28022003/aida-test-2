import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getServerEnv } from '@aida/config/server';
import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '../../openapi');
const publicOpenApiJsonPath = join(docsDir, 'public.openapi.json');

/** Public Swagger UI and OpenAPI spec (no auth). Internal spec is SDK/codegen only. */
export function createPublicDocsRoutes() {
  const publicDocsRoutes = new Hono();

  return publicDocsRoutes
    .get('/openapi.json', async (c) => {
      const file = await readFile(publicOpenApiJsonPath, 'utf8');
      const spec = JSON.parse(file) as Record<string, unknown>;
      const env = getServerEnv();

      spec.servers = [{ url: env.API_GATEWAY_DOMAIN ?? `http://localhost:${env.PORT}` }];

      return c.json(spec);
    })
    .get('/', swaggerUI({ url: '/docs/public/openapi.json' }));
}

export type AppType = ReturnType<typeof createPublicDocsRoutes>;
