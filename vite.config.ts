import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      // Custom middleware handles /api/rugby?_e=<endpoint>&<params>
      // so dev and prod use identical URLs.
    },
    // @ts-ignore — configureServer is valid but not in this overload
    configureServer(server: { middlewares: { use: (path: string, fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use('/api/rugby', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const apiKey = (env.RUGBY_API_KEY ?? '').trim();
          if (!apiKey) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'RUGBY_API_KEY missing in .env.local' }));
            return;
          }

          const qs   = req.url ?? '';
          const url  = new URL(`http://localhost${qs}`);
          const ep   = url.searchParams.get('_e') ?? '';
          url.searchParams.delete('_e');
          const upstream = `https://v1.rugby.api-sports.io/${ep}${url.search}`;

          const apires = await fetch(upstream, {
            headers: { 'x-apisports-key': apiKey, Accept: 'application/json' },
          });
          const body = await apires.text();

          res.writeHead(apires.status, { 'Content-Type': 'application/json' });
          res.end(body);
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
});
