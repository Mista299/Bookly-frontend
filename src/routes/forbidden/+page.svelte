<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { ShieldAlert } from 'lucide-svelte';
  import type { UserRole } from '$lib/types/auth';

  let target = $derived.by(() => {
    const role: UserRole | undefined = $auth.user?.role;
    if (role === 'ADMIN') return '/admin';
    if (role === 'PROFESSIONAL') return '/professional';
    if (role === 'CUSTOMER') return '/customer';
    return '/login';
  });

  async function goHome() {
    await goto(target, { replaceState: true });
  }
</script>

<svelte:head>
  <title>Acceso denegado · BOOKLY</title>
</svelte:head>

<main class="forbidden" data-od-id="forbidden-page">
  <PageHead
    eyebrow="Error 403"
    title="Acceso denegado."
    description="No tienes permisos para esta sección. Si crees que es un error, contacta a un administrador."
  />

  <article class="forbidden__card">
    <span class="forbidden__icon" aria-hidden="true">
      <ShieldAlert size={28} />
    </span>
    <h2 class="forbidden__heading">No cuentas con los permisos necesarios.</h2>
    <p class="forbidden__desc">
      Esta sección está reservada para otros roles dentro de BOOKLY. Te llevamos a un lugar
      seguro de acuerdo a tu sesión actual.
    </p>
    <div class="forbidden__actions">
      <Button onclick={goHome}>Volver al inicio</Button>
    </div>
  </article>
</main>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .forbidden {
    padding: $space-7 $space-5 $space-10;
    max-width: 640px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7 $space-12;
    }
  }

  .forbidden__card {
    background: var(--surface);
    border: 1px solid rgba(232, 124, 104, 0.32);
    border-radius: $radius-lg;
    padding: $space-7 $space-6;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $space-4;
    box-shadow: $shadow-1;

    @media (min-width: #{$bp-md}) {
      padding: $space-8 $space-7;
    }
  }

  .forbidden__icon {
    width: 56px;
    height: 56px;
    border-radius: $radius-pill;
    background: rgba(232, 124, 104, 0.14);
    color: $coral;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .forbidden__heading {
    font-family: $font-display;
    font-size: clamp(20px, 3.4vw, 24px);
    font-weight: $fw-semibold;
    letter-spacing: $ls-tight;
    color: var(--text);
    margin: 0;
  }

  .forbidden__desc {
    color: $muted;
    font-size: $fs-base;
    line-height: $lh-relaxed;
    margin: 0;
  }

  .forbidden__actions {
    display: flex;
    gap: $space-3;
    flex-wrap: wrap;
    margin-top: $space-2;
  }
</style>