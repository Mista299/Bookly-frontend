<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Booking } from '$lib/types/booking';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  let date = $state(new Date());
  let bookings = $state<Booking[]>([]);
  let loading = $state(true);

  function toISODate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function shiftDays(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    date = d;
  }

  function fmtDate(d: Date) {
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  async function load() {
    loading = true;
    try {
      bookings = await bookingService.list({ date: toISODate(date) });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los turnos.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }
  }

  onMount(load);

  $effect(() => {
    void date;
    if (typeof window !== 'undefined') load();
  });

  // Vista auto-switch: week en desktop, day en mobile.
  let view = $state<'day' | 'week'>('day');
  $effect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 900px)');
    const sync = () => {
      view = mq.matches ? 'week' : 'day';
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });
</script>

<svelte:head>
  <title>Mi agenda · BOOKLY Profesional</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Disponibilidad"
    title="Mi agenda."
    description="Lo que tienes reservado para cada día."
  />

  <div class="toolbar">
    <button type="button" class="nav-btn" aria-label="Día anterior" onclick={() => shiftDays(-1)}>
      <ChevronLeft size={18} />
    </button>
    <span class="toolbar__label">{fmtDate(date)}</span>
    <button type="button" class="nav-btn" aria-label="Día siguiente" onclick={() => shiftDays(1)}>
      <ChevronRight size={18} />
    </button>
  </div>

  {#if loading}
    <Skeleton lines={8} avatar />
  {:else}
    <Calendar
      {date}
      {bookings}
      {view}
      onSlotClick={() => {}}
    />
  {/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 980px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .toolbar {
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    padding: 4px;
    margin-bottom: $space-5;
  }

  .nav-btn {
    background: transparent;
    border: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: $muted;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: $ivory;
      color: $plum;
    }
  }

  .toolbar__label {
    padding: 0 $space-3;
    min-width: 220px;
    text-align: center;
    font-weight: $fw-medium;
    text-transform: capitalize;
  }
</style>