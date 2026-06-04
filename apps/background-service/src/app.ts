import { createServerObservability } from '@aida/observability/server';
import { Hono } from 'hono';

export const app = new Hono();
const observability = createServerObservability({ service: 'background-service' });

app.use(observability.requestLogger);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'background-service' });
});
