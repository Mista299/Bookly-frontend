<script lang="ts">
  import { page } from '$app/stores';
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import Money from '$lib/components/Money.svelte';
  import Select from '$lib/components/Select.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { serviceService } from '$lib/services/service';
  import { availabilityService } from '$lib/services/availability';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { auth } from '$lib/stores/auth';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { onMount } from 'svelte';
  import type { Service, ProfessionalSummary } from '$lib/types/service';
  import type { TimeSlot } from '$lib/types/booking';
  import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import {
    toISODate,
    fmtTime,
    addMinutes,
    parseLocal,
    toLocalDateTime,
    isSameDay,
    localDateTimeMinusNow
  } from '$lib/utils/date';

  const BOOKING_MIN_ADVANCE_MINUTES = 120;

  const id = $derived($page.params.id);

  let service = $state<Service | null>(null);
  let professionals = $state<ProfessionalSummary[]>([]);
  let availableSlots = $state<TimeSlot[]>([]);
  let date = $state(new Date());
  let selectedProfessional = $state<string>('');
  let selectedSlot = $state<string | null>(null);
  let loadingService = $state(true);
  let loadingProfessionals = $state(true);
  let loadingAvail = $state(false);
  let submitting = $state(false);
  let notFound = $state(false);
  let availMessage = $state<string | null>(null);

  const today = new Date();
  const isToday = $derived(isSameDay(date, today));

  const minAllowedMinutes = $derived(localDateTimeMinusNow(toLocalDateTime(new Date())));

  const hasNoProfessionals = $derived(
    !loadingProfessionals && professionals.length === 0
  );

  const selectedProfessionalObj = $derived(
    professionals.find((p) => p.id === selectedProfessional) ?? null
  );

  const selectedSlotMinutes = $derived.by(() => {
    if (!selectedSlot) return null;
    return localDateTimeMinusNow(selectedSlot);
  });

  const needsMoreAnticipation = $derived.by(() => {
    if (!isToday || !selectedSlot) return false;
    const minutes = localDateTimeMinusNow(selectedSlot);
    return minutes < BOOKING_MIN_ADVANCE_MINUTES;
  });

  const endTimeOfSelected = $derived.by(() => {
    if (!selectedSlot || !service) return null;
    const start = parseLocal(selectedSlot);
    return toLocalDateTime(addMinutes(start, service.durationMinutes));
  });

  const slotOptions = $derived(
    professionals.map((p) => ({
      value: p.id,
      label: `${p.fullName}${p.specialty ? ` · ${p.specialty}` : ''}`
    }))
  );

  onMount(async () => {
    try {
      service = await serviceService.get(id);
    } catch (err) {
      if (isApiError(err) && err.status === 404) notFound = true;
      else toasts.push(formatApiError(err, 'No se pudo cargar el servicio.'), 'danger');
    } finally {
      loadingService = false;
    }

    try {
      const list = await serviceService.listProfessionals(id);
      professionals = list;
      if (list.length > 0) {
        selectedProfessional = list[0].id;
      }
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudieron cargar los profesionales.'), 'danger');
    } finally {
      loadingProfessionals = false;
    }
  });

  async function loadAvailability() {
    if (!service || !selectedProfessional) {
      availableSlots = [];
      availMessage = null;
      return;
    }
    loadingAvail = true;
    availMessage = null;
    try {
      const day = toISODate(date);
      const response = await availabilityService.find({
        professionalId: selectedProfessional,
        serviceId: service.id,
        from: day,
        to: day
      });

      const dayEntry = response.days[0];
      if (!response.available || !dayEntry) {
        availableSlots = [];
        availMessage = response.message ?? 'No hay disponibilidad para esta fecha.';
      } else {
        availableSlots = dayEntry.slots.map((s) => ({
          start: s.startTime,
          end: s.endTime,
          state: 'AVAILABLE' as const
        }));
      }
    } catch (err) {
      availableSlots = [];
      availMessage = formatApiError(err, 'No se pudo consultar la disponibilidad.');
    } finally {
      loadingAvail = false;
    }
  }

  $effect(() => {
    void date;
    void selectedProfessional;
    void service;
    if (service && selectedProfessional) {
      void loadAvailability();
    }
  });

  function shiftDays(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    date = d;
    selectedSlot = null;
  }

  function handleSlotClick(slot: TimeSlot) {
    if (slot.state !== 'AVAILABLE') return;
    selectedSlot = slot.start;
  }

  async function confirmBooking() {
    if (!service || !selectedSlot || !endTimeOfSelected) return;
    const authState = $auth;
    if (!authState.user) {
      toasts.push('Inicia sesión para reservar.', 'warning');
      return;
    }

    const minutesToStart = localDateTimeMinusNow(selectedSlot);
    if (minutesToStart < BOOKING_MIN_ADVANCE_MINUTES) {
      toasts.push(
        `Necesitas al menos ${BOOKING_MIN_ADVANCE_MINUTES / 60} horas de anticipación.`,
        'warning'
      );
      return;
    }

    if (parseLocal(endTimeOfSelected).getTime() <= parseLocal(selectedSlot).getTime()) {
      toasts.push('La hora de fin debe ser mayor a la de inicio.', 'danger');
      return;
    }

    submitting = true;
    try {
      await bookingService.create({
        professionalId: selectedProfessional,
        serviceId: service.id,
        startTime: selectedSlot,
        endTime: endTimeOfSelected
      });
      toasts.push(
        `Reserva confirmada para ${fmtTime(selectedSlot)}. Te enviamos un correo.`,
        'success'
      );
      selectedSlot = null;
      await goto('/customer/agenda');
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'BOOKING_CONFLICT') {
        toasts.push('Ese horario ya no está disponible, elige otro.', 'warning');
        selectedSlot = null;
        await loadAvailability();
      } else {
        toasts.push(formatApiError(err, 'No se pudo confirmar la reserva.'), 'danger');
      }
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{service?.name ?? 'Servicio'} · BOOKLY</title>
</svelte:head>

<div class="page">
  <a class="back" href="/customer/services">
    <ArrowLeft size={14} /> Servicios
  </a>

  {#if loadingService}
    <Skeleton lines={6} avatar />
  {:else if notFound || !service}
    <PageHead title="Servicio no disponible" description="Este servicio ya no está activo." />
    <Button onclick={() => goto('/customer/services')}>Volver</Button>
  {:else}
    <header class="hero">
      <p class="eyebrow">{service.category}</p>
      <h1 class="hero__title">{service.name}</h1>
      {#if service.description}
        <p class="hero__desc">{service.description}</p>
      {/if}
      <div class="hero__meta">
        <span><Money value={service.price} /></span>
        <span class="hero__dot" aria-hidden="true">·</span>
        <span>{service.durationMinutes} min</span>
      </div>
    </header>

    {#if loadingProfessionals}
      <Skeleton lines={2} avatar />
    {:else if hasNoProfessionals}
      <EmptyState
        title="Este servicio aún no tiene profesionales asignados."
        description="Vuelve pronto, estamos añadiendo más profesionales."
      >
        {#snippet action()}
          <Button onclick={() => goto('/customer/services')}>Ver otros servicios</Button>
        {/snippet}
      </EmptyState>
    {:else}
      <section class="picker" data-od-id="customer-booking-picker">
        <div class="picker__head">
          <p class="eyebrow">Disponibilidad</p>
        </div>

        <div class="picker__controls">
          <div class="picker__field">
            <Select
              label="Profesional"
              bind:value={selectedProfessional}
              options={slotOptions}
              required
            />
          </div>
          <div class="picker__date" role="group" aria-label="Cambiar fecha">
            <button type="button" class="picker__nav" aria-label="Día anterior" onclick={() => shiftDays(-1)}>
              <ChevronLeft size={18} />
            </button>
            <span class="picker__date-label">
              {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button type="button" class="picker__nav" aria-label="Día siguiente" onclick={() => shiftDays(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {#if selectedProfessionalObj}
          <p class="picker__pro">
            Atendido por <strong>{selectedProfessionalObj.fullName}</strong>
            {#if selectedProfessionalObj.specialty}
              · <span class="picker__pro-spec">{selectedProfessionalObj.specialty}</span>
            {/if}
          </p>
        {/if}

        <div class="picker__calendar">
          {#if loadingAvail}
            <Skeleton lines={8} />
          {:else if availMessage}
            <div class="picker__msg" role="status">
              <p>{availMessage}</p>
            </div>
          {:else}
            <Calendar
              view="day"
              {date}
              slots={availableSlots}
              {selectedSlot}
              onSlotClick={handleSlotClick}
            />
          {/if}
        </div>

        {#if needsMoreAnticipation}
          <p class="picker__warn" role="status">
            Necesitas al menos {BOOKING_MIN_ADVANCE_MINUTES / 60}h de anticipación.
          </p>
        {/if}
      </section>

      <div class="cta">
        <Button
          size="lg"
          disabled={!selectedSlot || needsMoreAnticipation}
          loading={submitting}
          onclick={confirmBooking}
        >
          {selectedSlot
            ? `Confirmar ${fmtTime(selectedSlot)}`
            : 'Elige un horario'}
        </Button>
      </div>
    {/if}
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
    margin-bottom: $space-4;
  }

  .picker__controls {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-4;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: $space-5;
    }
  }

  .picker__field {
    flex: 1;
    min-width: 0;
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

  .picker__pro {
    font-size: $fs-sm;
    color: $muted;
    margin-bottom: $space-4;

    strong {
      color: $text;
      font-weight: $fw-semibold;
    }
  }

  .picker__pro-spec {
    color: $plum;
  }

  .picker__calendar {
    min-height: 240px;
  }

  .picker__msg {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-7 $space-5;
    text-align: center;
    color: $muted;
  }

  .picker__warn {
    margin-top: $space-3;
    font-size: $fs-sm;
    color: color.adjust($coral, $lightness: -8%);
    background: rgba(232, 124, 104, 0.1);
    border: 1px solid rgba(232, 124, 104, 0.25);
    padding: $space-3 $space-4;
    border-radius: $radius-md;
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