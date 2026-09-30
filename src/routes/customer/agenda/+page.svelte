<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Button from '$lib/components/Button.svelte';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Booking } from '$lib/types/booking';
  import { Plus, Calendar as CalIcon } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let bookings = $state<Booking[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      bookings = await bookingService.list({ date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar tus reservas.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }
  });

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  function statusLabel(s: Booking['status']) {
    return s === 'CONFIRMED' ? 'Confirmada' : s === 'PENDING' ? 'Pendiente' : 'Cancelada';
  }

  function statusTone(s: Booking['status']) {
    return s === 'CONFIRMED' ? 'success' : s === 'PENDING' ? 'info' : 'muted';
  }

  const upcoming = $derived(
    bookings.filter((b) => new Date(b.startTime) >= new Date() && b.status !== 'CANCELLED')
  );
</script>

<svelte:head>
  <title>Mi agenda · BOOKLY</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Tus reservas"
    title="Mi agenda."
    description="Lo que viene y lo que ya pasó."
  >
    {#snippet actions()}
      <Button onclick={() => goto('/customer/services')}>
        <Plus size={16} /> Nueva reserva
      </Button>
    {/snippet}
  </PageHead>

  {#if loading}
    <div class="list">
      {#each Array(3) as _, i (i)}
        <Skeleton lines={2} avatar />
      {/each}
    </div>
  {:else if bookings.length === 0}
    <EmptyState
      title="Sin reservas todavía."
      description="Cuando reserves un servicio aparecerá en este lugar."
    >
      {#snippet action()}
        <Button onclick={() => goto('/customer/services')}>
          <CalIcon size={16} /> Explorar servicios
        </Button>
      {/snippet}
    </EmptyState>
  {:else}
    <section class="list" data-od-id="customer-bookings">
      {#each upcoming as b (b.id)}
        <article class="booking">
          <div class="booking__date">
            <span class="booking__day">{new Date(b.startTime).getDate()}</span>
            <span class="booking__month">
              {new Date(b.startTime).toLocaleDateString('es-ES', { month: 'short' })}
            </span>
          </div>
          <div class="booking__main">
            <p class="booking__service">{b.serviceName}</p>
            <p class="booking__meta">
              {fmtTime(b.startTime)} · {fmtDate(b.startTime)}
            </p>
          </div>
          <span class="booking__status booking__status--{statusTone(b.status)}">
            {statusLabel(b.status)}
          </span>
        </article>
      {/each}
    </section>
  {/if}
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

  .list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .booking {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
    align-items: center;
    padding: $space-4 $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
  }

  .booking__date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 56px;
    padding: $space-2;
    background: $plum-soft;
    border-radius: $radius-sm;
    color: $plum;
  }

  .booking__day {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    line-height: 1;
  }

  .booking__month {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    margin-top: 4px;
  }

  .booking__main {
    min-width: 0;
  }

  .booking__service {
    font-weight: $fw-semibold;
    color: $text;
  }

  .booking__meta {
    font-size: $fs-sm;
    color: $muted;
    margin-top: 2px;
  }

  .booking__status {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    color: $muted;
    background: $ivory;
  }

  .booking__status--success {
    color: color.adjust($success, $lightness: -8%);
    background: rgba(94, 159, 122, 0.1);
    border-color: rgba(94, 159, 122, 0.2);
  }

  .booking__status--info {
    color: $plum;
    background: $plum-soft;
    border-color: $plum-soft;
  }
</style>