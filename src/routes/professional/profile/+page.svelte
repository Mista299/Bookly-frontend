<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { toasts } from '$lib/stores/toasts';
  import { UserRound, Mail, LogOut } from 'lucide-svelte';

  function logout() {
    auth.logout();
    toasts.push('Sesión cerrada.', 'info');
    goto('/login');
  }
</script>

<svelte:head>
  <title>Perfil · BOOKLY Profesional</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Tu cuenta"
    title="Perfil."
    description="Datos básicos de tu cuenta profesional."
  />

  {#if $auth.user}
    <section class="card" data-od-id="professional-profile">
      <header class="card__head">
        <span class="card__avatar" aria-hidden="true">
          <UserRound size={20} />
        </span>
        <div>
          <p class="card__name">{$auth.user.fullName}</p>
          <p class="card__role">Profesional</p>
        </div>
      </header>
      <dl class="card__list">
        <div class="card__row">
          <dt class="card__label">Correo</dt>
          <dd class="card__value">
            <Mail size={14} />
            {$auth.user.email}
          </dd>
        </div>
      </dl>
      <div class="card__actions">
        <Button variant="ghost" onclick={logout}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </section>
  {/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 640px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-6;
  }

  .card__head {
    display: flex;
    align-items: center;
    gap: $space-4;
    margin-bottom: $space-6;
    padding-bottom: $space-5;
    border-bottom: 1px solid $border;
  }

  .card__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .card__name {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    color: $text;
  }

  .card__role {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    color: $muted;
    margin-top: 2px;
  }

  .card__list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .card__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
  }

  .card__label {
    font-size: $fs-sm;
    color: $muted;
  }

  .card__value {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: $text;
    margin: 0;
  }

  .card__actions {
    margin-top: $space-6;
    padding-top: $space-5;
    border-top: 1px solid $border;
    display: flex;
    justify-content: flex-end;
  }
</style>