import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "sass:color";\n@use "$lib/styles/tokens" as *;\n`
      }
    }
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
  }
});