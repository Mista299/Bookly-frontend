<script lang="ts">
  import { page } from '$app/stores';
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import Money from '$lib/components/Money.svelte';
  import { serviceService } from '$lib/services/service';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Service } from '$lib/types/service';
  import type { Booking, TimeSlot } from '$lib/types/booking';
  import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  const id = $derived($page.params.id);

  let service = $state<Service | null>(null);
  let bookings = $state<Booking[]>([]);
  let loading = $state(true);
  let submitting = $state(false);
  let date = $state(new Date());
  let selectedSlot = $state<string | null>(null);
  let notFound = $state(false);

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

  async function loadBookings() {
    try {
      bookings = await bookingService.list({ date: toISODate(date) });
    } catch {
      bookings = [];
    }
  }

  onMount(async () => {
    try {
      service = await serviceService.get(id);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 404) notFound = true;
      else toasts.push(e.message ?? 'No se pudo cargar el servicio.', 'danger');
    } finally {
      loading = false;
    }
    await loadBookings();
  });

  $effect(() => {
    void date;
    if (service) loadBookings();
  });

  function handleSlotClick(slot: TimeSlot) {
    if (slot.state === 'BOOKED') return;
    selectedSlot = slot.start;
  }

  async function confirmBooking() {
    if (!service || !selectedSlot) return;
    // Backend doesn't expose POST /bookings yet (HU-08 pending). Bail early with a
    // clear "Próximamente" toast so the user understands why nothing happened.
    toasts.push('Las reservas estarán disponibles próximamente.', 'info');
    submitting = false;
    selectedSlot = null;
  }
</script>

<svelte:head>
  <title>{service?.name ?? 'Servicio'} · BOOKLY</title>
</svelte:head>

<div class="page">
  <a class="back" href="/customer/services">
    <ArrowLeft size={14} /> Servicios
  </a>

  {#if loading}
    <Skeleton lines={6} avatar />
  {:else if notFound || !service}
    <PageHead title="Servicio no disponible" description="Este servicio ya no está activo." />
    <Button onclick={() => goto('/customer/services')}>Volver</Button>
  {:else}
    <header class="hero">
      <p class="eyebrow">{service.category}</p>
      <h1 class="hero__title">{service.name}</h1>
      <p class="hero__desc">{service.description}</p>
      <div class="hero__meta">
        <span><Money value={service.price} /></span>
        <span class="hero__dot" aria-hidden="true">·</span>
        <span>{service.durationMinutes} min</span>
      </div>
    </header>

    <section class="picker" data-od-id="customer-booking-picker">
      <div class="picker__head">
        <p class="eyebrow">Disponibilidad</p>
        <div class="picker__date">
          <button type="button" class="picker__nav" aria-label="Día anterior" onclick={() => shiftDays(-1)}>
            <ChevronLeft size={18} />
          </button>
          <span class="picker__date-label">{fmtDate(date)}</span>
          <button type="button" class="picker__nav" aria-label="Día siguiente" onclick={() => shiftDays(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <Calendar
        {date}
        {bookings}
        view="day"
        {selectedSlot}
        onSlotClick={handleSlotClick}
      />
    </section>

    <div class="cta">
      <Button
        size="lg"
        disabled={!selectedSlot}
        loading={submitting}
        onclick={confirmBooking}
      >
        {selectedSlot
          ? `Confirmar ${new Date(selectedSlot).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
          : 'Elige un horario'}
      </Button>
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

  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: $muted;
    font-size: $fs-sm;
    margin-bottom: $space-5;

    &:hover {
      color: $plum;
    }
  }

  .hero {
    margin-bottom: $space-8;
  }

  .hero__title {
    font-family: $font-display;
    font-size: clamp(28px, 4vw, 38px);
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: 1.15;
    margin: $space-2 0 $space-3;
  }

  .hero__desc {
    font-size: $fs-md;
    color: $muted;
    line-height: $lh-relaxed;
    max-width: 56ch;
  }

  .hero__meta {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    margin-top: $space-5;
    font-size: $fs-md;
    color: $text;
    font-weight: $fw-semibold;
  }

  .hero__dot {
    color: $border;
  }

  .picker {
    margin-bottom: $space-8;
  }

  .picker__head {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-bottom: $space-4;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .picker__date {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    padding: 4px;
    align-self: flex-start;
  }

  .picker__nav {
    background: transparent;
    border: 0;
    width: 32px;
    height: 32px;
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

  .picker__date-label {
    padding: 0 $space-3;
    text-transform: capitalize;
    font-weight: $fw-medium;
    font-size: $fs-sm;
  }

  .cta {
    position: sticky;
    bottom: 80px;

    @media (min-width: #{$bp-md}) {
      position: static;
    }

    :global(.btn) {
      width: 100%;
    }
  }
</style>