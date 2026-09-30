<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  // Import via a vendored copy of the dist file (the package's exports field
  // routes the bare specifier to src/index.svelte.js which omits createCalendar).
  import * as EC from '$lib/calendar/ec.js';
  import '$lib/calendar/ec.css';
  import type { Booking, TimeSlot } from '$lib/types/booking';

  interface Props {
    date: Date;
    bookings: Booking[];
    view?: 'day' | 'week';
    selectedSlot?: string | null;
    onSlotClick?: (slot: TimeSlot) => void;
    selectable?: boolean;
  }

  let {
    date,
    bookings,
    view = 'day',
    selectedSlot = null,
    onSlotClick,
    selectable = true
  }: Props = $props();

  let container: HTMLDivElement;
  let cal: ReturnType<typeof EC.createCalendar> | null = null;

  const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
    CONFIRMED: { bg: 'rgba(94, 159, 122, 0.16)', fg: '#002106', border: '#5e9f7a' },
    PENDING: { bg: 'rgba(249, 168, 37, 0.18)', fg: '#241a00', border: '#F9A825' },
    CANCELLED: { bg: 'rgba(229, 224, 218, 0.6)', fg: '#49454f', border: '#79747e' },
    COMPLETED: { bg: 'rgba(63, 81, 181, 0.16)', fg: '#00105b', border: '#3F51B5' },
    NOSHOW: { bg: 'rgba(229, 57, 53, 0.16)', fg: '#410002', border: '#E53935' }
  };

  function buildEvents(list: Booking[]) {
    return list.map((b) => {
      const c = STATUS_COLORS[b.status] ?? STATUS_COLORS.CONFIRMED;
      return {
        id: b.id,
        title: `${b.serviceName} · ${b.customerName}`,
        start: b.startTime,
        end: b.endTime,
        display: 'block' as const,
        backgroundColor: c.bg,
        textColor: c.fg,
        borderColor: c.border,
        extendedProps: { booking: b }
      };
    });
  }

  function buildOptions() {
    return {
      view: view === 'week' ? 'timeGridWeek' : 'timeGridDay',
      initialDate: date.toISOString().slice(0, 10),
      locale: 'es',
      firstDay: 1,
      height: 'auto',
      slotMinTime: '07:00:00',
      slotMaxTime: '21:00:00',
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00',
      allDaySlot: false,
      nowIndicator: true,
      selectable,
      selectMirror: true,
      headerToolbar: {
        start: 'prev,next today',
        center: 'title',
        end: 'dayGridMonth,timeGridDay,timeGridWeek'
      },
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        day: 'Día',
        list: 'Lista'
      },
      events: buildEvents(bookings),
      select: (info: { start: Date; end: Date }) => {
        if (!onSlotClick) return;
        onSlotClick({
          start: info.start.toISOString(),
          end: info.end.toISOString(),
          state: 'AVAILABLE'
        });
      }
    };
  }

  onMount(() => {
    if (!browser || !container) return;
    cal = EC.createCalendar(container, [EC.DayGrid, EC.TimeGrid, EC.Interaction], buildOptions());
    return () => {
      if (cal) void EC.destroyCalendar(cal);
    };
  });

  $effect(() => {
    if (!cal) return;
    void date;
    void view;
    void bookings;
    cal.setOption('events', buildEvents(bookings));
    cal.setOption('initialDate', date.toISOString().slice(0, 10));
    cal.setOption('view', view === 'week' ? 'timeGridWeek' : 'timeGridDay');
  });
</script>

<div class="ec-wrap" bind:this={container}>
  {#if !browser}
    <div class="ec-placeholder">Cargando calendario…</div>
  {/if}
</div>

<style lang="scss">
  .ec-wrap {
    --ec-bg-color: #{$surface};
    --ec-text-color: #{$text};
    --ec-border-color: #{$border};
    --ec-button-bg-color: #{$surface};
    --ec-button-border-color: #{$border};
    --ec-button-text-color: #{$muted};
    --ec-button-active-bg-color: #{$plum-soft};
    --ec-button-active-border-color: #{$plum};
    --ec-button-active-text-color: #{$plum};
    --ec-button-hover-bg-color: #{$ivory};
    --ec-button-hover-border-color: #{$border};
    --ec-button-hover-text-color: #{$text};
    --ec-today-bg-color: #{color.adjust($ivory, $lightness: -3%)};
    --ec-highlight-color: #{$plum-soft};
    --ec-event-bg-color: #{$plum-soft};
    --ec-event-border-color: #{$plum};
    --ec-event-text-color: #{$plum};
    --ec-event-error-color: #{$danger};
    --ec-time-axis-color: #{$muted};
    --ec-time-axis-bg-color: transparent;
    --ec-line-color: #{color.adjust($border, $lightness: -3%)};
    --ec-bg-event-color: rgba(63, 81, 181, 0.08);
    --ec-bg-event-text-color: #{$text};
    --ec-day-header-color: #{$muted};
    --ec-day-header-bg-color: transparent;
    --ec-list-day-label-color: #{$text};
    --ec-list-day-bg-color: transparent;
    --ec-other-month-bg-color: #{$ivory};
    --ec-other-month-text-color: #{$muted};
    --ec-disabled-day-bg-color: #{$ivory};
    --ec-disabled-day-text-color: #{$muted};

    :global {
      .ec {
        font-family: $font-body;
        color: $text;
      }
      .ec-toolbar .ec-button {
        border-radius: $radius-sm;
        font-weight: $fw-medium;
        font-size: $fs-sm;
        padding: 6px 12px;
        text-transform: none;
      }
      .ec-toolbar .ec-button.ec-button-active {
        background: $plum-soft;
        border-color: $plum;
        color: $plum;
      }
      .ec-toolbar .ec-title {
        font-family: $font-display;
        font-weight: $fw-semibold;
        font-size: $fs-lg;
        color: $text;
      }
      .ec-day-header {
        font-weight: $fw-medium;
        font-size: $fs-sm;
        color: $muted;
      }
      .ec-day-header.ec-today {
        color: $plum;
        font-weight: $fw-semibold;
      }
      .ec-time-axis .ec-time,
      .ec-day-header .ec-day-number {
        color: $muted;
        font-size: $fs-xs;
      }
      .ec-event {
        border-radius: $radius-sm;
        font-size: $fs-xs;
        padding: 2px 6px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      }
      .ec-event-title {
        font-weight: $fw-medium;
      }
      .ec-now-indicator {
        background-color: $danger;
        height: 2px;
      }
      .ec-line {
        border-color: $border;
      }
      .ec-highlight {
        background: $plum-soft;
      }
    }
  }

  .ec-placeholder {
    padding: $space-7;
    text-align: center;
    color: $muted;
  }
</style>