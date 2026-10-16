<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/Button.svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import {
    AlertCircle,
    Compass,
    ShieldAlert,
    ServerCrash,
    RotateCcw
  } from 'lucide-svelte';

  type Variant = {
    title: string;
    description: string;
    icon: typeof AlertCircle;
    accent: 'danger' | 'warn' | 'muted';
  };

  const status = $derived($page.status);
  const message = $derived($page.error?.message ?? '');

  const variant = $derived.by<Variant>(() => {
    if (status === 404) {
      return {
        title: 'Página no encontrada',
        description: 'La ruta que buscas no existe o se movió. Vuelve al inicio.',
        icon: Compass,
        accent: 'muted'
      };
    }
    if (status === 401 || status === 403) {
      return {
        title: 'No tienes permisos',
        description: 'Tu sesión no permite acceder a este contenido. Inicia sesión con una cuenta autorizada.',
        icon: ShieldAlert,
        accent: 'warn'
      };
    }
    if (status >= 500) {
      return {
        title: 'Error del servidor',
        description: 'Tuvimos un problema al procesar tu solicitud. Intenta de nuevo en unos segundos.',
        icon: ServerCrash,
        accent: 'danger'
      };
    }
    return {
      title: 'Algo salió mal',
      description: 'No pudimos completar la operación. Revisa tu conexión e inténtalo otra vez.',
      icon: AlertCircle,
      accent: 'danger'
    };
  });

  async function handleHome() {
    await goto('/', { replaceState: true });
  }

  async function handleLogin() {
    await goto('/login', { replaceState: true });
  }

  async function handleRetry() {
    await invalidateAll();
  }
</script>

<svelte:head>
  <title>{status} · BOOKLY</title>
</svelte:head>

<main class="error" data-od-id="error-page">
  <article class="error__card" data-accent={variant.accent}>
    <span class="error__icon" aria-hidden="true">
      <variant.icon size={28} />
    </span>
    <p class="error__status" aria-label="Código HTTP">Error {status}</p>
    <h1 class="error__title">{variant.title}</h1>
    <p class="error__desc">{variant.description}</p>

    {#if message && message !== variant.title}
      <p class="error__detail" aria-live="polite">{message}</p>
    {/if}

    <div class="error__actions">
      {#if status === 404}
        <Button onclick={handleHome}>
          <Compass size={16} /> Ir al inicio
        </Button>
      {:else if status === 401 || status === 403}
        <Button onclick={handleLogin}>
          Iniciar sesión
        </Button>
        <Button variant="secondary" onclick={handleHome}>
          Volver al inicio
        </Button>
      {:else}
        <Button onclick={handleRetry}>
          <RotateCcw size={16} /> Reintentar
        </Button>
        <Button variant="secondary" onclick={handleHome}>
          Ir al inicio
        </Button>
      {/if}
    </div>
  </article>
</main>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .error {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: $space-7 $space-5;
    background: var(--bg);

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .error__card {
    width: 100%;
    max-width: 520px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: $radius-lg;
    padding: $space-7 $space-6;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: $space-3;
    box-shadow: $shadow-1;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }

    &[data-accent='danger'] {
      border-color: rgba(217, 107, 104, 0.32);
    }

    &[data-accent='warn'] {
      border-color: rgba(232, 124, 104, 0.32);
    }

    &[data-accent='muted'] {
      border-color: var(--border);
    }
  }

  .error__icon {
    width: 64px;
    height: 64px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $space-2;
  }

  .error__card[data-accent='danger'] .error__icon {
    background: rgba(217, 107, 104, 0.12);
    color: $danger;
  }

  .error__card[data-accent='warn'] .error__icon {
    background: rgba(232, 124, 104, 0.14);
    color: $coral;
  }

  .error__status {
    font-size: $fs-xs;
    font-weight: $fw-semibold;
    letter-spacing: $ls-wide;
    text-transform: uppercase;
    color: $muted;
    margin: 0;
  }

  .error__title {
    font-family: $font-display;
    font-size: clamp(24px, 4vw, 32px);
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: $lh-tight;
    color: var(--text);
    margin: 0;
  }

  .error__desc {
    color: $muted;
    font-size: $fs-md;
    line-height: $lh-relaxed;
    max-width: 42ch;
    margin: 0;
  }

  .error__detail {
    margin-top: $space-3;
    padding: $space-3 $space-4;
    background: $ivory;
    border-radius: $radius-sm;
    border: 1px solid var(--border);
    color: $muted;
    font-size: $fs-sm;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    word-break: break-word;
    max-width: 100%;
  }

  .error__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    justify-content: center;
    margin-top: $space-4;
  }
</style>