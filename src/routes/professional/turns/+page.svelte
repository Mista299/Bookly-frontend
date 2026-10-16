<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Textarea from '$lib/components/Textarea.svelte';
  import Button from '$lib/components/Button.svelte';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { auth } from '$lib/stores/auth';
  import { formatApiError } from '$lib/services/errors';
  import { onMount } from 'svelte';
  import type { Booking, BookingStatus } from '$lib/types/booking';
  import { fmtTime, parseLocal, localDateTimeMinusNow } from '$lib/utils/date';

  const BOOKING_MIN_ADVANCE_MINUTES = 120;

  let bookings = $state<Booking[]>([]);
  let loading = $state(true);
  let statusFilter = $state<'ALL' | BookingStatus>('ALL');
  let cancelOpen = $state(false);
  let cancelReason = $state('');
  let cancellingId = $state<string | null>(null);
  let cancelling = $state(false);

  const filters: Array<{ id: 'ALL' | BookingStatus; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'CONFIRMADA', label: 'Confirmados' },
    { id: 'CANCELADA', label: 'Cancelados' }
  ];

  const filtered = $derived(
    statusFilter === 'ALL' ? bookings : bookings.filter((b) => b.status === statusFilter)
  );

  const grouped = $derived.by(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const d = parseLocal(b.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => parseLocal(a.startTime).getTime() - parseLocal(b.startTime).getTime());
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  });

  function canCancel(b: Booking): boolean {
    if (b.status === 'CANCELADA') return false;
    return localDateTimeMinusNow(b.startTime) >= BOOKING_MIN_ADVANCE_MINUTES;
  }

  async function load() {
    const authState = $auth;
    if (!authState.user) {
      loading = false;
      return;
    }
    try {
      bookings = await bookingService.listForProfessional(authState.user.id);
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudieron cargar los turnos.'), 'danger');
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function fmtGroup(iso: string): string {
    return parseLocal(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  function statusLabel(s: BookingStatus): string {
    if (s === 'CONFIRMADA') return 'Confirmada';
    if (s === 'COMPLETED') return 'Completada';
    if (s === 'CANCELADA') return 'Cancelada';
    if (s === 'RESCHEDULED') return 'Reprogramada';
    return s;
  }

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
      toasts.push('Turno cancelado.', 'success');
      closeCancel();
      await load();
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudo cancelar el turno.'), 'danger');
    } finally {
      cancelling = false;
    }
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
    {#each filters as f (f.id)}
      <button
        type="button"
        class="chip"
        class:is-active={statusFilter === f.id}
        aria-pressed={statusFilter === f.id}
        onclick={() => (statusFilter = f.id)}
      >
        {f.label}
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
                  <p class="row__customer">{b.customerName ?? 'Cliente'}</p>
                  <p class="row__service">{b.serviceName ?? 'Servicio'}</p>
                </div>
                <div class="row__aside">
                  <span class="row__status row__status--{b.status.toLowerCase()}">
                    {statusLabel(b.status)}
                  </span>
                  {#if canCancel(b)}
                    <button
                      type="button"
                      class="row__cancel"
                      onclick={() => openCancel(b)}
                    >
                      Cancelar
                    </button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

<Modal
  bind:open={cancelOpen}
  title="Cancelar turno"
  description="El cliente recibirá un aviso de la cancelación."
  size="sm"
  onClose={closeCancel}
>
  <div class="cancel">
    <p class="cancel__intro">Esta acción no se puede deshacer.</p>
    <Textarea
      label="Motivo (opcional)"
      placeholder="Cuéntale al cliente por qué cancelas…"
      bind:value={cancelReason}
      maxlength={500}
      rows={4}
    />
    <p class="cancel__counter">{cancelReason.length} / 500</p>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={closeCancel}>Mantener turno</Button>
    <Button variant="danger" loading={cancelling} onclick={confirmCancel}>
      Sí, cancelar
    </Button>
  {/snippet}
</Modal>

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

    &:hover {
      color: $text;
    }

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
    text-transform: capitalize;
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

  .row__aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $space-2;
  }

  .row__status {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    background: $ivory;
    color: $muted;
    white-space: nowrap;
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
    color: color.adjust($danger, $lightness: -8%);
    background: rgba(217, 107, 104, 0.06);
    border-color: rgba(217, 107, 104, 0.2);
  }

  .row__cancel {
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
</style>