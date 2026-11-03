import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * La app se sirve como SPA estática:
 *
 * - `fallback: 'index.html'` → toda ruta (/customer/agenda, /admin/audit…)
 *   resuelve al index.html cliente. Es obligatorio para Capacitor, donde el
 *   WebView sirve los assets desde el filesystem local sin servidor Node.
 * - `strict: false` → no falla el build por rutas no prerenderizadas.
 */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: false
    })
  }
};
