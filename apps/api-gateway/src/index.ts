import 'dotenv/config';
import { getServerEnv } from '@aida/config/server';
import { serve } from '@hono/node-server';

import { createApp } from './app/index';
import { parseCorsAllowedOrigins } from './middleware/cors';
import { buildSupabaseAuthConfig } from './supabase/authConfig';

const env = getServerEnv();
const supabaseAuth = await buildSupabaseAuthConfig(env);

const app = createApp({
    corsAllowedOrigins: parseCorsAllowedOrigins(env.CORS_ALLOWED_ORIGINS),
    supabaseAuth,
});

serve(
    {
        fetch: app.fetch,
        port: env.PORT,
    },
    (info) => {
        console.log('api-gateway ready', {
            port: info.port,
        });
    },
);
