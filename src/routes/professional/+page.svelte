<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Button from '$lib/components/Button.svelte';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import type { Booking } from '$lib/types/booking';
  import { ChevronRight, Calendar as CalIcon } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let bookings = $state<Booking[]>([]);
  let loading = $state(true);

  const today = new Date();
  const todayLabel = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const todays = $derived(
    bookings
      .filter((b) => {
        const d = new Date(b.startTime);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate() &&
          b.status !== 'CANCELLED'
        );
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  );

  onMount(async () => {
    try {
      bookings = await bookingService.list({ date: today.toISOString().slice(0, 10) });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar tus turnos.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }
  });

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
</script>

<svelte:head>
  <title>Hoy · BOOKLY Profesional</title>
</svelte:head>

<div class="page">
  <header class="head">
    <p class="eyebrow">Hoy</p>
    <h1 class="head__title">
      {#if $auth.user}
        Buenas, <span class="head__name">{$auth.user.fullName.split(' ')[0]}</span>.
      {:else}
        Tu día.
      {/if}
    </h1>
    <p class="head__date">{todayLabel}</p>
  </header>

  <section class="counter" data-od-id="professional-today-count">
    <p class="counter__label">Turnos hoy</p>
    {#if loading}
      <p class="counter__value placeholder">—</p>
    {:else}
      <p class="counter__value">{todays.length}</p>
    {/if}
    <a class="counter__link" href="/professional/agenda">
      Ver mi agenda
      <ChevronRight size={14} />
    </a>
  </section>

  <section class="turns" data-od-id="professional-today-turns">
    <h2 class="turns__title">Turnos del día</h2>

    {#if loading}
      <div class="turns__list">
        {#each Array(3) as _, i (i)}
          <Skeleton lines={2} avatar />
        {/each}
      </div>
    {:else if todays.length === 0}
      <EmptyState
        title="No tienes turnos hoy."
        description="Tu agenda está libre. Disfruta el día o revisa la semana."
      >
        {#snippet action()}
          <Button onclick={() => goto('/professional/agenda')}>
            <CalIcon size={16} /> Ir a mi agenda
          </Button>
        {/snippet}
      </EmptyState>
    {:else}
      <ul class="turns__list">
        {#each todays as b (b.id)}
          <li class="turn">
            <span class="turn__time">{fmtTime(b.startTime)}</span>
            <div class="turn__main">
              <p class="turn__customer">{b.customerName}</p>
              <p class="turn__service">{b.serviceName}</p>
            </div>
            <ChevronRight size={16} class="turn__chev" />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 720px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .head {
    margin-bottom: $space-7;
  }

  .head__title {
    font-family: $font-display;
    font-size: clamp(28px, 5vw, 38px);
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: 1.15;
    margin: $space-2 0 $space-2;
  }

  .head__name { color: $plum; }

  .head__date {
    color: $muted;
    text-transform: capitalize;
  }

  .counter {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-6;
    margin-bottom: $space-7;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .counter__label {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    color: $muted;
    font-weight: $fw-medium;
  }

  .counter__value {
    font-family: $font-display;
    font-size: 56px;
    font-weight: $fw-semibold;
    line-height: 1;
    color: $plum;
  }

  .counter__value.placeholder { color: $border; }

  .counter__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: $space-3;
    color: $plum;
    font-size: $fs-sm;
    font-weight: $fw-medium;

    &:hover { gap: 10px; transition: gap 120ms ease; }
  }

  .turns__title {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    letter-spacing: $ls-tight;
    margin-bottom: $space-4;
  }

  .turns__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .turn {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
    align-items: center;
    padding: $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    transition: border-color var(--dur-fast) var(--ease-out);

    &:hover {
      border-color: color.adjust($border, $lightness: -8%);
    }
  }

  .turn__time {
    font-family: $font-display;
    font-size: $fs-lg;
    font-weight: $fw-semibold;
    color: $plum;
    font-variant-numeric: tabular-nums;
    min-width: 56px;
  }

  .turn__main {
    min-width: 0;
  }

  .turn__customer {
    font-weight: $fw-medium;
    color: $text;
  }

  .turn__service {
    font-size: $fs-sm;
    color: $muted;
    margin-top: 2px;
  }
</style>