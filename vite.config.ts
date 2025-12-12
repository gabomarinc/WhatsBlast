import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno, incluyendo las que no tienen prefijo VITE_
  // El tercer argumento '' le dice a Vite que cargue TODO.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Inyectamos manualmente las variables de base de datos para que el cliente pueda leerlas
      // Esto permite usar DATABASE_URL y AUTH_DATABASE_URL directamente en Vercel/Netlify
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
      'process.env.AUTH_DATABASE_URL': JSON.stringify(env.AUTH_DATABASE_URL),
    },
  };
});