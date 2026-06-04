import { defineConfig } from '@rcmade/hono-docs';

import { createApiGroups, INTERNAL_OPENAPI_OUTPUT, OPENAPI_BASE_CONFIG } from './hono-docs';

export default defineConfig({
    ...OPENAPI_BASE_CONFIG,
    outputs: {
        openApiJson: INTERNAL_OPENAPI_OUTPUT,
    },
    apis: createApiGroups(() => true),
});
