import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api/rugby': {
          target: 'https://v1.rugby.api-sports.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/rugby/, ''),
          headers: { 'x-apisports-key': env.RUGBY_API_KEY ?? '' },
        },
      },
    },
  };
});
