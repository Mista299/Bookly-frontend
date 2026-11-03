import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // El modo "android" carga .env.android, que define la URL absoluta de la
  // API (el APK no tiene proxy de Vite). El resto de modos usan .env/.env.local.
  const env = loadEnv(mode, process.cwd(), '');
  const isAndroid = mode === 'android';

  return {
    plugins: [sveltekit()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "sass:color";\n@use "$lib/styles/tokens" as *;\n`
        }
      }
    },
    define: {
      // VITE_API_URL debe quedar embebido en el bundle del APK.
      'import.meta.env.VITE_API_URL': JSON.stringify(
        isAndroid ? env.VITE_API_URL : undefined
      )
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': {
          // 18080 = backend en Docker (compose). 8080 = backend corrido con `java -jar` en local.
          target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:18080',
          changeOrigin: true,
          secure: false
        }
      }
    },
    // Rutas relativas: los assets deben resolver bajo el esquema del WebView
    // de Capacitor (http://localhost), no bajo la raíz del servidor.
    base: './'
  };
});
