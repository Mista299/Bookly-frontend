<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Booking } from '$lib/types/booking';

  let bookings = $state<Booking[]>([]);
  let loading = $state(true);
  let statusFilter = $state<'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'>('ALL');

  const filtered = $derived(
    statusFilter === 'ALL' ? bookings : bookings.filter((b) => b.status === statusFilter)
  );

  const grouped = $derived.by(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const key = new Date(b.startTime).toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  });

  onMount(async () => {
    try {
      bookings = await bookingService.list({ date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los turnos.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }
  });

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtGroup(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  function statusLabel(s: Booking['status']) {
    return s === 'CONFIRMED' ? 'Confirmado' : s === 'PENDING' ? 'Pendiente' : 'Cancelado';
  }
</script>

<svelte:head>
  <title>Turnos · BOOKLY Profesional</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Gestión"
    title="Turnos."
    description="Listado completo de reservas para hoy y próximos días."
  />

  <div class="chips" role="tablist">
    {#each [['ALL', 'Todos'], ['CONFIRMED', 'Confirmados'], ['PENDING', 'Pendientes'], ['CANCELLED', 'Cancelados']] as [val, lbl] (val)}
      <button
        type="button"
        class="chip"
        class:is-active={statusFilter === val}
        onclick={() => (statusFilter = val as typeof statusFilter)}
      >
        {lbl}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="list">
      {#each Array(4) as _, i (i)}
        <Skeleton lines={2} avatar />
      {/each}
    </div>
  {:else if filtered.length === 0}
    <EmptyState
      title="Sin turnos en este filtro."
      description="Cuando haya reservas nuevas las verás aquí, agrupadas por día."
    />
  {:else}
    <div class="groups" data-od-id="professional-turns-list">
      {#each grouped as [dateIso, list] (dateIso)}
        <section class="group">
          <h3 class="group__title">{fmtGroup(dateIso)}</h3>
          <ul class="list">
            {#each list as b (b.id)}
              <li class="row">
                <span class="row__time">{fmtTime(b.startTime)}</span>
                <div class="row__main">
                  <p class="row__customer">{b.customerName}</p>
                  <p class="row__service">{b.serviceName}</p>
                </div>
                <span class="row__status row__status--{b.status.toLowerCase()}">
                  {statusLabel(b.status)}
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 880px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .chips {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    margin-bottom: $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    flex-wrap: wrap;
  }

  .chip {
    border: 0;
    background: transparent;
    padding: 6px 14px;
    border-radius: $radius-pill;
    font-size: $fs-sm;
    color: $muted;
    cursor: pointer;

    &:hover { color: $text; }

    &.is-active {
      background: $plum;
      color: $surface;
    }
  }

  .groups {
    display: flex;
    flex-direction: column;
    gap: $space-7;
  }

  .group__title {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    color: $muted;
    font-weight: $fw-medium;
    margin-bottom: $space-3;
  }

  .list {
    display: flex;
    flex-direction: column;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
    align-items: center;
    padding: $space-4 $space-5;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }
  }

  .row__time {
    font-family: $font-display;
    font-size: $fs-md;
    font-weight: $fw-semibold;
    color: $plum;
    font-variant-numeric: tabular-nums;
    min-width: 56px;
  }

  .row__main {
    min-width: 0;
  }

  .row__customer {
    font-weight: $fw-medium;
    color: $text;
  }

  .row__service {
    font-size: $fs-sm;
    color: $muted;
    margin-top: 2px;
  }

  .row__status {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    background: $ivory;
    color: $muted;
  }

  .row__status--confirmed {
    color: color.adjust($success, $lightness: -8%);
    background: rgba(94, 159, 122, 0.1);
    border-color: rgba(94, 159, 122, 0.2);
  }

  .row__status--pending {
    color: $plum;
    background: $plum-soft;
    border-color: $plum-soft;
  }

  .row__status--cancelled {
    opacity: 0.7;
  }
</style>