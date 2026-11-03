<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Button from '$lib/components/Button.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Textarea from '$lib/components/Textarea.svelte';
  import { bookingService } from '$lib/services/booking';
  import { enrichBookings } from '$lib/services/bookingNames';
  import { toasts } from '$lib/stores/toasts';
  import { auth } from '$lib/stores/auth';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { onMount } from 'svelte';
  import type { Booking } from '$lib/types/booking';
  import { Plus, Calendar as CalIcon, History } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import {
    fmtTime,
    isFuture,
    localDateTimeMinusNow,
    parseLocal
  } from '$lib/utils/date';

  const BOOKING_MIN_ADVANCE_MINUTES = 120;

  let bookings = $state<Booking[]>([]);
  let loading = $state(true);
  let cancellingId = $state<string | null>(null);
  let cancelOpen = $state(false);
  let cancelReason = $state('');
  let cancelling = $state(false);
  let showHistory = $state(false);

  function statusLabel(s: Booking['status']): string {
    if (s === 'CONFIRMADA') return 'Confirmada';
    if (s === 'COMPLETED') return 'Completada';
    if (s === 'CANCELADA') return 'Cancelada';
    if (s === 'RESCHEDULED') return 'Reprogramada';
    return s;
  }

  function statusTone(s: Booking['status']): 'success' | 'info' | 'muted' | 'danger' {
    if (s === 'CONFIRMADA') return 'success';
    if (s === 'COMPLETED') return 'muted';
    if (s === 'CANCELADA') return 'danger';
    if (s === 'RESCHEDULED') return 'info';
    return 'muted';
  }

  function canCancel(b: Booking): boolean {
    if (b.status === 'CANCELADA') return false;
    const minutes = localDateTimeMinusNow(b.startTime);
    return minutes >= BOOKING_MIN_ADVANCE_MINUTES;
  }

  async function load() {
    const authState = $auth;
    if (!authState.user) {
      loading = false;
      return;
    }
    try {
      const raw = await bookingService.listForCustomer(authState.user.id);
      // El backend no incluye serviceName/professionalName: los resolvemos
      // cruzando con el catálogo para no mostrar "Servicio"/"Profesional".
      bookings = await enrichBookings(raw);
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        bookings = [];
      } else {
        toasts.push(formatApiError(err, 'No se pudieron cargar tus reservas.'), 'danger');
      }
    } finally {
      loading = false;
    }
  }

  // Recargar reservas cada vez que cambia el usuario autenticado.
  // El onMount puede ejecutarse antes de que el bootstrap termine.
  let lastUserId: string | null = null;
  $effect(() => {
    const uid = $auth.user?.id ?? null;
    if (uid && uid !== lastUserId) {
      lastUserId = uid;
      void load();
    } else if (!uid) {
      lastUserId = null;
    }
  });

  const upcoming = $derived(
    bookings
      .filter((b) => b.status !== 'CANCELADA' && isFuture(b.startTime))
      .sort((a, b) => parseLocal(a.startTime).getTime() - parseLocal(b.startTime).getTime())
  );

  const past = $derived(
    bookings
      .filter((b) => b.status === 'CANCELADA' || !isFuture(b.startTime))
      .sort((a, b) => parseLocal(b.startTime).getTime() - parseLocal(a.startTime).getTime())
  );

  function openCancel(b: Booking) {
    cancellingId = b.id;
    cancelReason = '';
    cancelOpen = true;
  }

  function closeCancel() {
    cancelOpen = false;
    cancellingId = null;
    cancelReason = '';
  }

  async function confirmCancel() {
    if (!cancellingId) return;
    const reason = cancelReason.trim();
    if (reason.length > 500) {
      toasts.push('El motivo no puede superar 500 caracteres.', 'warning');
      return;
    }
    cancelling = true;
    try {
      await bookingService.cancel(cancellingId, reason ? { reason } : {});
      toasts.push('Reserva cancelada.', 'success');
      closeCancel();
      await load();
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudo cancelar la reserva.'), 'danger');
    } finally {
      cancelling = false;
    }
  }

  function dayParts(iso: string): { day: string; month: string } {
    const d = parseLocal(iso);
    return {
      day: String(d.getDate()),
      month: d.toLocaleDateString('es-ES', { month: 'short' })
    };
  }
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
    {#if upcoming.length === 0}
      <EmptyState
        title="No tienes próximas reservas."
        description="Cuando reserves algo nuevo aparecerá aquí."
      >
        {#snippet action()}
          <Button onclick={() => goto('/customer/services')}>
            <Plus size={16} /> Hacer una reserva
          </Button>
        {/snippet}
      </EmptyState>
    {:else}
      <section class="list" data-od-id="customer-bookings">
        {#each upcoming as b (b.id)}
          {@const parts = dayParts(b.startTime)}
          <article class="booking">
            <div class="booking__date">
              <span class="booking__day">{parts.day}</span>
              <span class="booking__month">{parts.month}</span>
            </div>
            <div class="booking__main">
              <p class="booking__service">{b.serviceName ?? 'Servicio'}</p>
              <p class="booking__meta">
                {fmtTime(b.startTime)} · {b.professionalName ?? 'Profesional'}
              </p>
            </div>
            <div class="booking__aside">
              <span class="booking__status booking__status--{statusTone(b.status)}">
                {statusLabel(b.status)}
              </span>
              {#if canCancel(b)}
                <button
                  type="button"
                  class="booking__cancel"
                  onclick={() => openCancel(b)}
                >
                  Cancelar
                </button>
              {/if}
            </div>
          </article>
        {/each}
      </section>
    {/if}

    {#if past.length > 0}
      <section class="history" data-od-id="customer-bookings-history">
        <button
          type="button"
          class="history__toggle"
          aria-expanded={showHistory}
          onclick={() => (showHistory = !showHistory)}
        >
          <History size={16} />
          Historial ({past.length})
        </button>
        {#if showHistory}
          <ul class="history__list">
            {#each past as b (b.id)}
              {@const parts = dayParts(b.startTime)}
              <li class="history__row">
                <div class="history__date">
                  <span class="history__day">{parts.day}</span>
                  <span class="history__month">{parts.month}</span>
                </div>
                <div class="history__main">
                  <p class="history__service">{b.serviceName ?? 'Servicio'}</p>
                  <p class="history__meta">
                    {fmtTime(b.startTime)} · {b.professionalName ?? 'Profesional'}
                  </p>
                </div>
                <span class="history__status history__status--{statusTone(b.status)}">
                  {statusLabel(b.status)}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<Modal
  bind:open={cancelOpen}
  title="Cancelar reserva"
  description="Puedes agregar un motivo opcional para el profesional."
  size="sm"
  onClose={closeCancel}
>
  <div class="cancel">
    <p class="cancel__intro">Esta acción no se puede deshacer.</p>
    <Textarea
      label="Motivo (opcional)"
      placeholder="Cuéntale al profesional por qué cancelas…"
      bind:value={cancelReason}
      maxlength={500}
      rows={4}
    />
    <p class="cancel__counter">
      {cancelReason.length} / 500
    </p>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={closeCancel}>Mantener reserva</Button>
    <Button
      variant="danger"
      loading={cancelling}
      onclick={confirmCancel}
    >
      Sí, cancelar
    </Button>
  {/snippet}
</Modal>

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

  .booking__aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $space-2;
  }

  .booking__status {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    color: $muted;
    background: $ivory;
    white-space: nowrap;
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

  .booking__status--danger {
    color: color.adjust($danger, $lightness: -8%);
    background: rgba(217, 107, 104, 0.1);
    border-color: rgba(217, 107, 104, 0.2);
  }

  .booking__cancel {
    background: transparent;
    border: 0;
    color: $plum;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;

    &:hover {
      color: color.adjust($plum, $lightness: 8%);
    }
  }

  .history {
    margin-top: $space-8;
    border-top: 1px solid $border;
    padding-top: $space-5;
  }

  .history__toggle {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    background: transparent;
    border: 0;
    color: $muted;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    cursor: pointer;
    padding: 0;

    &:hover {
      color: $plum;
    }
  }

  .history__list {
    list-style: none;
    margin: $space-4 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .history__row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-3;
    align-items: center;
    padding: $space-3 $space-4;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    opacity: 0.85;
  }

  .history__date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 44px;
    padding: 2px $space-1;
    color: $muted;
  }

  .history__day {
    font-family: $font-display;
    font-size: $fs-md;
    font-weight: $fw-semibold;
    line-height: 1;
  }

  .history__month {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    margin-top: 4px;
  }

  .history__main {
    min-width: 0;
  }

  .history__service {
    font-weight: $fw-medium;
    color: $text;
    font-size: $fs-sm;
  }

  .history__meta {
    font-size: $fs-xs;
    color: $muted;
    margin-top: 2px;
  }

  .history__status {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 3px 8px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    color: $muted;
    background: $ivory;
    white-space: nowrap;
  }

  .history__status--success {
    color: color.adjust($success, $lightness: -8%);
    background: rgba(94, 159, 122, 0.1);
    border-color: rgba(94, 159, 122, 0.2);
  }

  .history__status--info {
    color: $plum;
    background: $plum-soft;
    border-color: $plum-soft;
  }

  .history__status--danger {
    color: color.adjust($danger, $lightness: -8%);
    background: rgba(217, 107, 104, 0.1);
    border-color: rgba(217, 107, 104, 0.2);
  }

  .cancel {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .cancel__intro {
    font-size: $fs-sm;
    color: $muted;
  }

  .cancel__counter {
    font-size: $fs-xs;
    color: $muted;
    align-self: flex-end;
  }

  // botón de cancelar reserva: objetivo táctil de 44px en móvil.
  @media (max-width: #{$bp-lg - 1px}) {
    .booking__cancel {
      min-height: $touch-target;
      display: inline-flex;
      align-items: center;
    }
  }

  // botón de historial: objetivo táctil de 44px en móvil.
  @media (max-width: #{$bp-lg - 1px}) {
    .history__toggle {
      min-height: $touch-target;
      display: inline-flex;
      align-items: center;
    }
  }
</style>