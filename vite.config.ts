import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        proxy:{
          '/api': {
            target: 'http://192.168.1.6:3000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '')
          }
        },
        secure: false,
        port: 8080,
        host: "0.0.0.0",
        allowedHosts: ['13e1cd8b471d.ngrok-free.app','immune-smoothly-quail.ngrok-free.app', '.ngrok.io'],
        mimeTypes: {
          'text/javascript': ['.ts'],
        },
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.endsWith('.ts')) {
              res.setHeader('Content-Type', 'text/javascript');
            }
            next();
          });
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
