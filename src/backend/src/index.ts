import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import guest from './routes/guest';
import host from './routes/host';

const app = new Hono();

app.use('/*', cors());

app.route('/guest', guest);
app.route('/host', host);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

export default app;
