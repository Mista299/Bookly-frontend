<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { bookingService } from '$lib/services/booking';
  import { enrichBookings } from '$lib/services/bookingNames';
  import { toasts } from '$lib/stores/toasts';
  import { auth } from '$lib/stores/auth';
  import { formatApiError } from '$lib/services/errors';
  import { onMount } from 'svelte';
  import type { Booking, TimeSlot } from '$lib/types/booking';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { toLocalDateTime, isSameDay, parseLocal } from '$lib/utils/date';

  let date = $state(new Date());
  let bookings = $state<Booking[]>([]);
  let loading = $state(true);
  let view = $state<'day' | 'week'>('day');

  function shiftDays(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    date = d;
  }

  async function load() {
    const authState = $auth;
    if (!authState.user) {
      loading = false;
      return;
    }
    loading = true;
    try {
      const raw = await bookingService.listForProfessional(authState.user.id);
      bookings = await enrichBookings(raw);
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudieron cargar los turnos.'), 'danger');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(min-width: 900px)');
      const sync = () => {
        view = mq.matches ? 'week' : 'day';
      };
      sync();
      mq.addEventListener('change', sync);
      return () => mq.removeEventListener('change', sync);
    }
  });

  const dayBookings = $derived(
    bookings
      .filter((b) => b.status !== 'CANCELADA' && isSameDay(parseLocal(b.startTime), date))
      .sort((a, b) => parseLocal(a.startTime).getTime() - parseLocal(b.startTime).getTime())
  );

  function buildSlots(target: Date): TimeSlot[] {
    const out: TimeSlot[] = [];
    const workdayStart = 8;
    const workdayEnd = 20;
    const slotMinutes = 30;
    const base = new Date(target);
    base.setHours(workdayStart, 0, 0, 0);
    const totalSlots = (workdayEnd - workdayStart) * (60 / slotMinutes);
    for (let i = 0; i < totalSlots; i++) {
      const start = new Date(base.getTime() + i * slotMinutes * 60_000);
      const end = new Date(start.getTime() + slotMinutes * 60_000);
      const booking = dayBookings.find((b) => {
        const bs = parseLocal(b.startTime);
        return bs.getTime() === start.getTime();
      });
      if (booking) {
        out.push({
          start: toLocalDateTime(start),
          end: toLocalDateTime(end),
          state: 'BOOKED',
          booking
        });
      } else {
        out.push({
          start: toLocalDateTime(start),
          end: toLocalDateTime(end),
          state: 'AVAILABLE'
        });
      }
    }
    return out;
  }

  const slots = $derived(buildSlots(date));
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
    <span class="toolbar__label">
      {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
    </span>
    <button type="button" class="nav-btn" aria-label="Día siguiente" onclick={() => shiftDays(1)}>
      <ChevronRight size={18} />
    </button>
  </div>

  {#if loading}
    <Skeleton lines={8} avatar />
  {:else}
    <Calendar
      {date}
      {slots}
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