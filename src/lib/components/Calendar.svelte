<script lang="ts">
  import type { Booking, SlotState, TimeSlot } from '$lib/types/booking';

  interface Props {
    date: Date;
    bookings: Booking[];
    view: 'day' | 'week';
    workdayStart?: number;
    workdayEnd?: number;
    slotMinutes?: number;
    selectedSlot?: string | null;
    onSlotClick?: (slot: TimeSlot) => void;
  }

  let {
    date,
    bookings,
    view,
    workdayStart = 8,
    workdayEnd = 20,
    slotMinutes = 30,
    selectedSlot = null,
    onSlotClick
  }: Props = $props();

  const slotsPerHour = $derived(60 / slotMinutes);

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
      const state: SlotState = booking ? 'BOOKED' : 'AVAILABLE';
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
  const today = new Date();

  const weekDays = $derived.by(() => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);
    return Array.from({ length: 5 }, (_, i) => {
      const nd = new Date(monday);
      nd.setDate(monday.getDate() + i);
      return nd;
    });
  });

  const nowLineTop = $derived.by(() => {
    if (!isSameDay(date, today)) return null;
    const startOfDay = new Date(date);
    startOfDay.setHours(workdayStart, 0, 0, 0);
    const totalSeconds = (today.getTime() - startOfDay.getTime()) / 1000;
    const workSeconds = (workdayEnd - workdayStart) * 3600;
    if (totalSeconds < 0 || totalSeconds > workSeconds) return null;
    const pct = (totalSeconds / workSeconds) * 100;
    return `${pct}%`;
  });

  function fmtHour(d: string | Date) {
    return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDow(d: Date) {
    return d.toLocaleDateString('es-ES', { weekday: 'short' });
  }

  function fmtDay(d: Date) {
    return d.getDate();
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
    <div class="day-header">
      <span class="day-header__date">
        {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
      {#if isSameDay(date, today)}
        <span class="day-header__today">Hoy</span>
      {/if}
    </div>

    <div class="day-grid">
        <div class="day-time-col" aria-hidden="true">
          {#each Array((workdayEnd - workdayStart) * slotsPerHour) as _, i (i)}
            <div class="day-time-cell" class:is-hour-mark={i % slotsPerHour === 0}>
              {#if i % slotsPerHour === 0}
                <span class="day-time-label">{String(workdayStart + Math.floor(i / slotsPerHour)).padStart(2, '0')}:00</span>
              {/if}
            </div>
          {/each}
        </div>

        <div class="day-slots-col">
          {#each daySlots as slot, i (slot.start)}
            {@const hourLabel = fmtHour(slot.start)}
            {@const isHourMark = i % slotsPerHour === 0}
            {@const isSelected = selectedSlot === slot.start}
            <button
              type="button"
              class="day-slot"
              class:is-hour-mark={isHourMark}
              class:is-selected={isSelected}
              class:is-booked={slot.state === 'BOOKED'}
              disabled={slot.state === 'BOOKED'}
              aria-pressed={isSelected}
              aria-label={`${hourLabel} · ${stateLabel(isSelected ? 'SELECTED' : slot.state)}${slot.booking ? ` · ${slot.booking.customerName}` : ''}`}
              onclick={() => clickSlot(slot)}
            >
              {#if slot.booking}
                <span class="day-slot__bar" aria-hidden="true"></span>
                <span class="day-slot__time">{hourLabel}</span>
                <span class="day-slot__customer">{slot.booking.customerName}</span>
                <span class="day-slot__service">{slot.booking.serviceName}</span>
              {:else}
                <span class="day-slot__time">{hourLabel}</span>
                <span class="day-slot__hint">Toca para seleccionar</span>
              {/if}
            </button>
          {/each}

          {#if nowLineTop}
            <div class="now-line" style="top: {nowLineTop}" aria-hidden="true">
              <span class="now-line__dot"></span>
            </div>
          {/if}
        </div>
      </div>
  </div>
{:else}
  <div class="cal cal--week" data-od-id="calendar-week">
    <div class="week-header">
      <div class="week-header__time-spacer" aria-hidden="true"></div>
      {#each weekDays as wd (wd.toISOString())}
        <div class="week-header__day" class:is-today={isSameDay(wd, today)}>
          <span class="week-header__dow">{fmtDow(wd)}</span>
          <span class="week-header__num">{fmtDay(wd)}</span>
        </div>
      {/each}
    </div>

    <div class="week-grid">
      <div class="week-col week-col--time">
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
        {@const isToday = isSameDay(wd, today)}
        <div class="week-col" class:is-today={isToday}>
          {#each slots as slot (slot.start)}
            {@const isSelected = selectedSlot === slot.start}
            <button
              type="button"
              class="week-cell week-cell--{isSelected ? 'selected' : slot.state.toLowerCase()}"
              aria-label={`${wd.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })} ${fmtHour(slot.start)} ${stateLabel(isSelected ? 'SELECTED' : slot.state)}`}
              disabled={slot.state === 'BOOKED'}
              onclick={() => clickSlot(slot)}
            >
              {#if slot.booking}
                <span class="week-cell__dot" aria-hidden="true"></span>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style lang="scss">
  /* =============================================================
     DAY VIEW
     ============================================================= */
  .cal--day {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding: $space-4 $space-5;
    background: color.adjust($ivory, $lightness: -2%);
    border-bottom: 1px solid $border;
  }

  .day-header__date {
    font-weight: $fw-semibold;
    color: $text;
    font-size: $fs-md;
    text-transform: capitalize;
  }

  .day-header__today {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    letter-spacing: $ls-wide;
    text-transform: uppercase;
    color: $plum;
    background: $plum-soft;
    padding: 2px 10px;
    border-radius: $radius-pill;
  }

  .day-grid {
    display: grid;
    grid-template-columns: 56px 1fr;
    position: relative;
  }

  .day-time-col {
    border-right: 1px solid $border;
    background: $ivory;
  }

  .day-time-cell {
    height: 44px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 4px 8px 0 0;
  }

  .day-time-label {
    font-size: $fs-xs;
    color: $muted;
    font-variant-numeric: tabular-nums;
    transform: translateY(-6px);
    background: $surface;
    padding: 0 2px;
  }

  .day-slots-col {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .day-slot {
    appearance: none;
    border: 0;
    background: transparent;
    border-top: 1px solid color.adjust($border, $lightness: -3%);
    border-bottom: 1px solid color.adjust($border, $lightness: -3%);
    margin: -1px 0;
    padding: 6px 14px;
    min-height: 44px;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    color: $text;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);

    &:hover:not(:disabled) {
      background: color.adjust($plum-soft, $lightness: 4%);
    }

    &.is-hour-mark {
      border-top-color: $border;
    }

    &.is-selected {
      background: $plum-soft;
      box-shadow: inset 3px 0 0 $plum;
    }

    &.is-booked {
      cursor: not-allowed;
      background: rgba(63, 81, 181, 0.06);
    }

    &:disabled {
      opacity: 0.7;
    }
  }

  .day-slot__time {
    font-size: $fs-xs;
    color: $muted;
    font-variant-numeric: tabular-nums;
  }

  .day-slot__hint {
    font-size: $fs-xs;
    color: color.adjust($muted, $lightness: 15%);
  }

  .day-slot__bar {
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: $plum;
    border-radius: 0 2px 2px 0;
  }

  .day-slot__customer {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text;
  }

  .day-slot__service {
    font-size: $fs-xs;
    color: $muted;
  }

  .now-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: $danger;
    z-index: 5;
    pointer-events: none;
  }

  .now-line__dot {
    position: absolute;
    left: -4px;
    top: -3px;
    width: 8px;
    height: 8px;
    background: $danger;
    border-radius: 50%;
  }

  /* =============================================================
     WEEK VIEW
     ============================================================= */
  .cal--week {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .week-header {
    display: grid;
    grid-template-columns: 56px repeat(5, 1fr);
    background: color.adjust($ivory, $lightness: -2%);
    border-bottom: 1px solid $border;
  }

  .week-header__time-spacer {
    border-right: 1px solid $border;
  }

  .week-header__day {
    padding: $space-3 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: $muted;
    border-left: 1px solid $border;

    &.is-today {
      color: $plum;
    }
  }

  .week-header__dow {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
  }

  .week-header__num {
    font-size: $fs-md;
    font-weight: $fw-semibold;
    color: inherit;
  }

  .week-grid {
    display: grid;
    grid-template-columns: 56px repeat(5, 1fr);
  }

  .week-col {
    display: flex;
    flex-direction: column;
    border-left: 1px solid $border;

    &.is-today {
      background: rgba(63, 81, 181, 0.03);
    }
  }

  .week-col--time {
    background: $ivory;
    border-left: 0;
    border-right: 1px solid $border;
  }

  .week-time {
    flex: 1;
    min-height: 28px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 2px 8px 0 0;
    border-top: 1px solid color.adjust($border, $lightness: -3%);

    span {
      font-size: $fs-xs;
      color: $muted;
      transform: translateY(-6px);
      background: $ivory;
      padding: 0 2px;
    }
  }

  .week-cell {
    flex: 1;
    min-height: 28px;
    appearance: none;
    border: 0;
    background: transparent;
    border-top: 1px solid color.adjust($border, $lightness: -3%);
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);
    position: relative;

    &:hover:not(:disabled) {
      background: color.adjust($plum-soft, $lightness: 4%);
    }

    &.week-cell--booked {
      cursor: not-allowed;
      background: rgba(63, 81, 181, 0.08);

      &:hover {
        background: rgba(63, 81, 181, 0.12);
      }
    }

    &.week-cell--selected {
      background: $plum-soft;
      box-shadow: inset 0 0 0 2px $plum;
    }
  }

  .week-cell__dot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: $plum;
    border-radius: 50%;
  }
</style>