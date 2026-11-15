import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Las peticiones a /api se reenvían a la API de Node.js, así no hace falta configurar CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
