<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import Select from '$lib/components/Select.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import { bookingService } from '$lib/services/booking';
  import { professionalService } from '$lib/services/professional';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Booking, TimeSlot } from '$lib/types/booking';
  import type { Professional } from '$lib/types/professional';
  import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-svelte';

  let date = $state(new Date());
  let bookings = $state<Booking[]>([]);
  let professionals = $state<Professional[]>([]);
  let selectedProfessionalId = $state<string>('all');
  let loading = $state(true);
  let view = $state<'day' | 'week'>('day');
  let selectedSlot = $state<string | null>(null);

  const professionalOptions = $derived([
    { value: 'all', label: 'Todos los profesionales' },
    ...professionals.map((p) => ({ value: p.id, label: p.fullName }))
  ]);

  function fmtDateLong(d: Date) {
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  function fmtDateShort(d: Date) {
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  function shiftDays(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    date = d;
  }

  function goToToday() {
    date = new Date();
  }

  function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  $effect(() => {
    void (async () => {
      loading = true;
      try {
        const target = selectedProfessionalId === 'all' ? null : selectedProfessionalId;
        bookings = await bookingService.list({ date: toISODate(date), professionalId: target ?? undefined });
      } catch (err) {
        const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los turnos.';
        toasts.push(msg, 'danger');
      } finally {
        loading = false;
      }
    })();
  });

  onMount(async () => {
    try {
      professionals = await professionalService.list();
    } catch {
      // No bloqueante: la agenda funciona aunque falle el filtro de profesionales.
    }
  });

  function handleSlotClick(slot: TimeSlot) {
    selectedSlot = slot.start;
    toasts.push(`Slot ${new Date(slot.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} seleccionado.`, 'info');
  }

  // Autoajuste: week view si hay ancho suficiente.
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

  const bookedCount = $derived(bookings.filter((b) => b.status !== 'CANCELLED').length);
</script>

<svelte:head>
  <title>Agenda · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Agenda"
  title="Vista de turnos."
  description="Supervisa la disponibilidad por profesional. Selecciona un día para ver el detalle."
>
  {#snippet actions()}
    <Button variant="secondary" onclick={goToToday}>
      <CalendarIcon size={16} /> Hoy
    </Button>
  {/snippet}
</PageHead>

<div class="toolbar">
  <div class="toolbar__date">
    <button type="button" class="nav-btn" aria-label="Día anterior" onclick={() => shiftDays(-1)}>
      <ChevronLeft size={18} />
    </button>
    <div class="toolbar__date-label">
      <span class="toolbar__date-long">{fmtDateLong(date)}</span>
      <span class="toolbar__date-short">{fmtDateShort(date)}</span>
    </div>
    <button type="button" class="nav-btn" aria-label="Día siguiente" onclick={() => shiftDays(1)}>
      <ChevronRight size={18} />
    </button>
  </div>

  <div class="toolbar__filters">
    <div class="toolbar__pro">
      <Users size={16} />
      <Select
        options={professionalOptions}
        bind:value={selectedProfessionalId}
        placeholder="Profesional"
      />
    </div>
  </div>
</div>

<div class="meta">
  <div class="meta__item">
    <span class="meta__label">Turnos del día</span>
    <span class="meta__value">{bookedCount}</span>
  </div>
  <div class="meta__legend">
    <span class="legend"><span class="legend__dot legend__dot--available"></span>Disponible</span>
    <span class="legend"><span class="legend__dot legend__dot--booked"></span>Ocupado</span>
    <span class="legend"><span class="legend__dot legend__dot--selected"></span>Seleccionado</span>
  </div>
</div>

{#if loading}
  <Skeleton lines={8} avatar />
{:else}
  <Calendar
    {date}
    {bookings}
    {view}
    {selectedSlot}
    onSlotClick={handleSlotClick}
  />
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .toolbar {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-6;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: $space-6;
    }
  }

  .toolbar__date {
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    padding: 4px;
    align-self: flex-start;
  }

  .nav-btn {
    background: transparent;
    border: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: $muted;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);

    &:hover {
      background: $ivory;
      color: $plum;
    }
  }

  .toolbar__date-label {
    padding: 0 $space-3;
    min-width: 200px;
    text-align: center;
    font-weight: $fw-medium;
    text-transform: capitalize;
  }

  .toolbar__date-long {
    display: none;

    @media (min-width: #{$bp-md}) {
      display: inline;
    }
  }

  .toolbar__date-short {
    @media (min-width: #{$bp-md}) {
      display: none;
    }
  }

  .toolbar__filters {
    display: flex;
    gap: $space-3;
    flex-wrap: wrap;
  }

  .toolbar__pro {
    display: inline-flex;
    align-items: center;
    gap: $space-3;

    :global(svg) {
      color: $muted;
    }

    :global(.field) {
      min-width: 240px;
    }
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-5;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .meta__item {
    display: inline-flex;
    align-items: baseline;
    gap: $space-3;
  }

  .meta__label {
    font-size: $fs-sm;
    color: $muted;
  }

  .meta__value {
    font-family: $font-display;
    font-size: $fs-2xl;
    font-weight: $fw-semibold;
    color: $plum;
    font-variant-numeric: tabular-nums;
  }

  .meta__legend {
    display: inline-flex;
    align-items: center;
    gap: $space-4;
    flex-wrap: wrap;
  }

  .legend {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    color: $muted;
  }

  .legend__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .legend__dot--available {
    background: $success;
  }
  .legend__dot--booked {
    background: $danger;
  }
  .legend__dot--selected {
    background: $plum;
  }
</style>