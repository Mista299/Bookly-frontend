<script lang="ts">
  import '$lib/styles/index.scss';
  import Toaster from '$lib/components/Toaster.svelte';
  import { auth } from '$lib/stores/auth';
  import { UNAUTHORIZED_EVENT } from '$lib/services/api';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { children } = $props();

  onMount(() => {
    auth.bootstrap();

    const onUnauth = () => {
      // Si el usuario está en una ruta privada, redirigir al login.
      // Para rutas públicas, simplemente limpiamos la sesión sin interrumpir.
      const path = $page.url?.pathname ?? '';
      const isPrivate =
        path.startsWith('/admin') ||
        path.startsWith('/professional') ||
        path.startsWith('/customer');
      if (isPrivate) {
        toasts.push('Tu sesión expiró. Inicia sesión de nuevo.', 'warning');
        void goto('/login', { replaceState: true });
      }
    };

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauth);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauth);
  });
</script>

{@render children?.()}
<Toaster />
