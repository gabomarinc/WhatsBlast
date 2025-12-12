import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno, incluyendo las que no tienen prefijo VITE_
  // Esto permite leer DATABASE_URL desde Vercel o .env local
  // Fix: Cast process to any to access cwd() which exists in Node environment but might be missing in generic Process types
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Inyectamos manualmente la variable DATABASE_URL para que el código cliente la vea
      // Esto soluciona el problema de que Vercel use "DATABASE_URL" sin el prefijo "VITE_"
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
    },
  };
});