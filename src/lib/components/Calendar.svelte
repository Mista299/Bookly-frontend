<script lang="ts">
  import type { Booking, SlotState, TimeSlot } from '$lib/types/booking';

  interface Props {
    date: Date;
    bookings: Booking[];
    view: 'day' | 'week';
    /** Horario de atención. Por defecto 09:00–19:00. */
    workdayStart?: number; // hora 0–23
    workdayEnd?: number;   // hora 0–23
    /** Duración de cada slot en minutos. Por defecto 30. */
    slotMinutes?: number;
    selectedSlot?: string | null;
    onSlotClick?: (slot: TimeSlot) => void;
  }

  let {
    date,
    bookings,
    view,
    workdayStart = 9,
    workdayEnd = 19,
    slotMinutes = 30,
    selectedSlot = null,
    onSlotClick
  }: Props = $props();

  const slotsPerHour = $derived(60 / slotMinutes);

  // Construye los slots de un día completo entre workdayStart y workdayEnd.
  function buildDaySlots(day: Date): TimeSlot[] {
    const out: TimeSlot[] = [];
    const base = new Date(day);
    base.setHours(workdayStart, 0, 0, 0);

    const totalSlots = (workdayEnd - workdayStart) * slotsPerHour;
    for (let i = 0; i < totalSlots; i++) {
      const start = new Date(base.getTime() + i * slotMinutes * 60_000);
      const end = new Date(start.getTime() + slotMinutes * 60_000);

      const booking = bookings.find((b) => {
        const bs = new Date(b.startTime);
        return bs.getTime() === start.getTime() && b.status !== 'CANCELLED';
      });

      let state: SlotState;
      if (booking) state = 'BOOKED';
      else state = 'AVAILABLE';

      out.push({ start: start.toISOString(), end: end.toISOString(), state, booking });
    }
    return out;
  }

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const daySlots = $derived(buildDaySlots(date));

  // Para week view: array de 5 días (Lun–Vie).
  const weekDays = $derived.by(() => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Dom, 1=Lun
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);
    return Array.from({ length: 5 }, (_, i) => {
      const nd = new Date(monday);
      nd.setDate(monday.getDate() + i);
      return nd;
    });
  });

  function fmtHour(d: string | Date) {
    return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  function stateLabel(state: SlotState) {
    switch (state) {
      case 'AVAILABLE': return 'Disponible';
      case 'BOOKED': return 'Ocupado';
      case 'NO_SERVICE': return 'Sin servicio';
      case 'OUT_OF_HOURS': return 'Fuera de horario';
      case 'SELECTED': return 'Seleccionado';
    }
  }

  function clickSlot(slot: TimeSlot) {
    if (slot.state === 'BOOKED') return;
    onSlotClick?.(slot);
  }
</script>

{#if view === 'day'}
  <div class="cal cal--day" data-od-id="calendar-day">
    <ol class="day-slots">
      {#each daySlots as slot, i (slot.start)}
        {@const hourLabel = fmtHour(slot.start)}
        {@const isHourMark = i % slotsPerHour === 0}
        {@const isSelected = selectedSlot === slot.start}
        <li class="slot" class:is-hour-mark={isHourMark}>
          <span class="slot__time">{hourLabel}</span>
          <button
            type="button"
            class="slot__btn slot--{isSelected ? 'selected' : slot.state.toLowerCase()}"
            disabled={slot.state === 'BOOKED'}
            aria-pressed={isSelected}
            onclick={() => clickSlot(slot)}
          >
            <span class="slot__state">{stateLabel(isSelected ? 'SELECTED' : slot.state)}</span>
            {#if slot.booking}
              <span class="slot__booking">
                <span class="slot__customer">{slot.booking.customerName}</span>
                <span class="slot__service">{slot.booking.serviceName}</span>
              </span>
            {/if}
          </button>
        </li>
      {/each}
    </ol>
  </div>
{:else}
  <div class="cal cal--week" data-od-id="calendar-week">
    <div class="week-grid">
      <div class="week-col week-col--time">
        <div class="week-col__head" aria-hidden="true"></div>
        {#each Array((workdayEnd - workdayStart) * slotsPerHour) as _, i (i)}
          <div class="week-time">
            {#if i % slotsPerHour === 0}
              <span>{String(workdayStart + Math.floor(i / slotsPerHour)).padStart(2, '0')}:00</span>
            {/if}
          </div>
        {/each}
      </div>
      {#each weekDays as wd, dayIdx (wd.toISOString())}
        {@const slots = buildDaySlots(wd)}
        {@const isToday = isSameDay(wd, new Date())}
        <div class="week-col" class:is-today={isToday}>
          <div class="week-col__head">
            <span class="week-col__dow">{wd.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
            <span class="week-col__day">{wd.getDate()}</span>
          </div>
          <div class="week-cells">
            {#each slots as slot (slot.start)}
              {@const isSelected = selectedSlot === slot.start}
              <button
                type="button"
                class="week-cell week-cell--{isSelected ? 'selected' : slot.state.toLowerCase()}"
                aria-label={`${wd.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })} ${fmtHour(slot.start)} ${stateLabel(isSelected ? 'SELECTED' : slot.state)}`}
                disabled={slot.state === 'BOOKED'}
                onclick={() => clickSlot(slot)}
              ></button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  /* =====================================================
     Day view (mobile-first)
     ===================================================== */
  .cal--day {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .day-slots {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .slot {
    display: grid;
    grid-template-columns: 64px 1fr;
    align-items: stretch;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }
  }

  .slot.is-hour-mark .slot__time {
    font-weight: $fw-medium;
  }

  .slot__time {
    padding: $space-3 $space-3;
    font-size: $fs-sm;
    color: $muted;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: flex-start;
    border-right: 1px solid $border;
  }

  .slot__btn {
    appearance: none;
    border: 0;
    background: transparent;
    text-align: left;
    padding: $space-3 $space-4;
    cursor: pointer;
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: $space-3;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);

    &:hover:not(:disabled) {
      background: $ivory;
    }
  }

  .slot__btn:disabled {
    cursor: not-allowed;
  }

  .slot__state {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    min-width: 92px;
  }

  .slot__booking {
    display: flex;
    flex-direction: column;
    line-height: $lh-snug;
    font-size: $fs-sm;
  }

  .slot__customer {
    font-weight: $fw-medium;
    color: $text;
  }

  .slot__service {
    color: $muted;
    font-size: $fs-xs;
  }

  /* Estados del slot (day) */
  .slot--available .slot__state {
    color: color.adjust($success, $lightness: -8%);
  }

  .slot--booked .slot__state {
    color: color.adjust($danger, $lightness: -6%);
  }

  .slot--no_service .slot__state {
    color: $muted;
  }

  .slot--out_of_hours {
    opacity: 0.45;
  }

  .slot--selected {
    background: $plum-soft;
    border-left: 3px solid $plum;

    .slot__state {
      color: $plum;
    }
  }

  /* =====================================================
     Week view (desktop)
     ===================================================== */
  .cal--week {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .week-grid {
    display: grid;
    grid-template-columns: 64px repeat(5, 1fr);
  }

  .week-col {
    border-left: 1px solid $border;
    min-width: 0;

    &:first-of-type {
      border-left: 0;
    }
  }

  .week-col--time .week-col__head {
    border-top: 0;
  }

  .week-col__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $space-3 $space-2;
    background: $ivory;
    border-bottom: 1px solid $border;
    border-top: 1px solid $border;
    gap: 2px;
  }

  .week-col__dow {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    color: $muted;
    font-weight: $fw-medium;
  }

  .week-col__day {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    color: $text;
    font-variant-numeric: tabular-nums;
  }

  .is-today .week-col__day {
    color: $plum;
  }

  .week-col--time .week-col__head {
    background: transparent;
    border: 0;
  }

  .week-time {
    height: 56px;
    padding: 4px 8px;
    font-size: 11px;
    color: $muted;
    font-variant-numeric: tabular-nums;
    border-bottom: 1px solid $border;

    &:last-child {
      border-bottom: 0;
    }
  }

  .week-cells {
    display: grid;
    grid-auto-rows: 56px;
  }

  .week-cell {
    appearance: none;
    border: 0;
    border-bottom: 1px solid $border;
    background: $surface;
    cursor: pointer;
    padding: 0;
    transition: background var(--dur-fast) var(--ease-out);

    &:last-child {
      border-bottom: 0;
    }

    &:hover:not(:disabled) {
      background: $ivory;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  .week-cell--booked {
    background: rgba(217, 107, 104, 0.08);
    background-image: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      rgba(217, 107, 104, 0.15) 4px,
      rgba(217, 107, 104, 0.15) 5px
    );

    &:hover {
      background: rgba(217, 107, 104, 0.12);
    }
  }

  .week-cell--available {
    background: rgba(94, 159, 122, 0.05);
  }

  .week-cell--selected {
    background: $plum-soft;
    box-shadow: inset 0 0 0 2px $plum;
  }
</style>