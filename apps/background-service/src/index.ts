import 'dotenv/config';
import { getWorkerEnv } from '@aida/config/worker';
import { serve } from '@hono/node-server';

import { app } from './app';

// Validate worker environment variables before starting
const env = getWorkerEnv();

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log('background-service ready', {
      port: info.port,
    });
  },
);
