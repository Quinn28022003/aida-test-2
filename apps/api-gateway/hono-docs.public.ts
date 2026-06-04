import { defineConfig } from '@rcmade/hono-docs';

import { createApiGroups, OPENAPI_BASE_CONFIG, PUBLIC_OPENAPI_OUTPUT } from './hono-docs';

export default defineConfig({
    ...OPENAPI_BASE_CONFIG,
    outputs: {
        openApiJson: PUBLIC_OPENAPI_OUTPUT,
    },
    apis: createApiGroups((mount) => mount.publicDocs),
});
