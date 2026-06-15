import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // Dev-only proxy: intercepts /api/rugby?_e=<endpoint>&... and forwards
      // to api-sports.io with the API key, matching Vercel's Edge Function behaviour.
      {
        name: 'rugby-api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/rugby')) { next(); return; }

            const apiKey = (env.RUGBY_API_KEY ?? '').trim();
            if (!apiKey) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'RUGBY_API_KEY missing in .env.local' }));
              return;
            }

            try {
              const parsed = new URL(req.url, 'http://localhost');
              const ep     = parsed.searchParams.get('_e') ?? '';
              parsed.searchParams.delete('_e');
              const upstream = `https://v1.rugby.api-sports.io/${ep}${parsed.search}`;

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
      },
    ],
    server: { host: '0.0.0.0' },
  };
});
