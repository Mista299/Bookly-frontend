<script lang="ts">
  import { DAYS_OF_WEEK, type DayOfWeek, type ScheduleSlot } from '$lib/types/schedule';

  interface Props {
    initialSlots: ScheduleSlot[];
    onSave: (slots: ScheduleSlot[]) => Promise<void> | void;
  }

  let { initialSlots, onSave }: Props = $props();

  const dayLabels: Record<DayOfWeek, string> = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo'
  };

  const shortLabels: Record<DayOfWeek, string> = {
    MONDAY: 'L',
    TUESDAY: 'M',
    WEDNESDAY: 'X',
    THURSDAY: 'J',
    FRIDAY: 'V',
    SATURDAY: 'S',
    SUNDAY: 'D'
  };

  type RowsByDay = Record<DayOfWeek, Array<{ startTime: string; endTime: string }>>;

  function emptyRows(): RowsByDay {
    return DAYS_OF_WEEK.reduce((acc, d) => {
      acc[d] = [];
      return acc;
    }, {} as RowsByDay);
  }

  function fromInitial(slots: ScheduleSlot[]): RowsByDay {
    const acc = emptyRows();
    for (const s of slots || []) {
      if (!acc[s.dayOfWeek]) continue;
      acc[s.dayOfWeek].push({ startTime: s.startTime, endTime: s.endTime });
    }
    return acc;
  }

  // svelte-ignore state_referenced_locally
  let rows: RowsByDay = $state(fromInitial(initialSlots ?? []));
  let errors: Record<string, string> = $state({});
  let saving = $state(false);
  let dirty = $state(false);
  let touched = $state<Record<string, boolean>>({});

  function key(d: DayOfWeek, idx: number) {
    return `${d}:${idx}`;
  }

  function addRow(d: DayOfWeek) {
    rows[d] = [...rows[d], { startTime: '09:00', endTime: '18:00' }];
    dirty = true;
  }

  function removeRow(d: DayOfWeek, idx: number) {
    rows[d] = rows[d].filter((_, i) => i !== idx);
    dirty = true;
    delete errors[key(d, idx)];
    touched = { ...touched };
  }

  function updateField(d: DayOfWeek, idx: number, field: 'startTime' | 'endTime', value: string) {
    rows[d][idx] = { ...rows[d][idx], [field]: value };
    rows[d] = [...rows[d]];
    dirty = true;
    touched[key(d, idx)] = true;
    validateFor(d, idx);
  }

  function minutesOf(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function toSlots(): ScheduleSlot[] {
    const out: ScheduleSlot[] = [];
    for (const d of DAYS_OF_WEEK) {
      for (const r of rows[d]) {
        if (!r.startTime || !r.endTime) continue;
        out.push({ dayOfWeek: d, startTime: r.startTime, endTime: r.endTime });
      }
    }
    return out;
  }

  function validate() {
    const next: Record<string, string> = {};
    const all = toSlots();
    for (const d of DAYS_OF_WEEK) {
      rows[d].forEach((r, i) => {
        const k = key(d, i);
        if (!r.startTime && !r.endTime) return;
        if (!r.startTime) {
          next[k] = 'Hora de inicio obligatoria.';
          return;
        }
        if (!r.endTime) {
          next[k] = 'Hora de fin obligatoria.';
          return;
        }
        const start = minutesOf(r.startTime);
        const end = minutesOf(r.endTime);
        if (start >= end) {
          next[k] = 'Inicio debe ser antes del fin.';
        }
      });
    }
    // Detectar solapamientos el mismo día.
    for (const d of DAYS_OF_WEEK) {
      const list = rows[d]
        .map((r, i) => ({ ...r, i }))
        .filter((r) => !next[key(d, r.i)] && r.startTime && r.endTime)
        .sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));
      for (let i = 1; i < list.length; i++) {
        if (minutesOf(list[i].startTime) < minutesOf(list[i - 1].endTime)) {
          next[key(d, list[i].i)] = 'Solapa con otra franja del mismo día.';
        }
      }
    }
    errors = next;
    return Object.keys(next).length === 0;
  }

  function validateFor(d: DayOfWeek, idx: number) {
    const next = { ...errors };
    const k = key(d, idx);
    delete next[k];
    const r = rows[d][idx];
    if (r.startTime || r.endTime) {
      if (!r.startTime) next[k] = 'Hora de inicio obligatoria.';
      else if (!r.endTime) next[k] = 'Hora de fin obligatoria.';
      else if (minutesOf(r.startTime) >= minutesOf(r.endTime)) next[k] = 'Inicio debe ser antes del fin.';
    }
    errors = next;
  }

  function totalHours(): number {
    let total = 0;
    for (const d of DAYS_OF_WEEK) {
      for (const r of rows[d]) {
        if (!r.startTime || !r.endTime) continue;
        total += Math.max(0, minutesOf(r.endTime) - minutesOf(r.startTime)) / 60;
      }
    }
    return total;
  }

  const hours = $derived(totalHours());

  async function save() {
    if (!validate()) return;
    saving = true;
    try {
      await onSave(toSlots());
      dirty = false;
      touched = {};
    } finally {
      saving = false;
    }
  }

  function reset() {
    rows = fromInitial(initialSlots);
    errors = {};
    touched = {};
    dirty = false;
  }
</script>

<section class="sched" aria-label="Horario semanal">
  <div class="sched__layout" role="table">
    <div class="sched__row sched__row--head" role="row">
      <div class="sched__day" role="columnheader">Día</div>
      <div class="sched__slots" role="columnheader">Franjas</div>
      <div class="sched__add" role="columnheader"></div>
    </div>
    {#each DAYS_OF_WEEK as d (d)}
      <div class="sched__row" role="row">
        <div class="sched__day" role="rowheader">
          <span class="sched__day-full">{dayLabels[d]}</span>
          <span class="sched__day-short">{shortLabels[d]}</span>
        </div>
        <div class="sched__slots">
          {#if rows[d].length === 0}
            <p class="sched__empty">Sin franjas. El día aparece cerrado.</p>
          {/if}
          {#each rows[d] as r, i (key(d, i))}
            <div class="range">
              <input
                type="time"
                step="300"
                value={r.startTime}
                aria-label="Inicio"
                onchange={(e) => updateField(d, i, 'startTime', (e.target as HTMLInputElement).value)}
              />
              <span aria-hidden="true">–</span>
              <input
                type="time"
                step="300"
                value={r.endTime}
                aria-label="Fin"
                onchange={(e) => updateField(d, i, 'endTime', (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="range__remove"
                aria-label={`Quitar franja ${dayLabels[d]}`}
                onclick={() => removeRow(d, i)}
              >
                ×
              </button>
              {#if errors[key(d, i)]}
                <p class="range__err">{errors[key(d, i)]}</p>
              {/if}
            </div>
          {/each}
        </div>
        <div class="sched__add">
          <button type="button" class="sched__add-btn" onclick={() => addRow(d)}>
            + Franja
          </button>
        </div>
      </div>
    {/each}
  </div>

  <footer class="sched__foot">
    <p class="sched__summary">
      <span class="muted">Total semanal estimado:</span>
      <strong>{hours.toFixed(1)} h</strong>
    </p>
    <div class="sched__actions">
      <button type="button" class="btn-ghost" onclick={reset} disabled={!dirty || saving}>
        Descartar
      </button>
      <button
        type="button"
        class="btn-primary"
        onclick={save}
        disabled={!dirty || saving || Object.keys(errors).length > 0}
      >
        {saving ? 'Guardando…' : 'Guardar horario'}
      </button>
    </div>
  </footer>
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .sched {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .sched__layout {
    display: flex;
    flex-direction: column;
  }

  .sched__row {
    display: grid;
    grid-template-columns: 92px 1fr 92px;
    gap: $space-3;
    align-items: flex-start;
    padding: $space-4 $space-5;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
      background: color.adjust($ivory, $lightness: -2%);
    }
  }

  .sched__row--head {
    align-items: center;
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    color: $muted;
    font-weight: $fw-medium;
  }

  .sched__day {
    font-family: $font-display;
    font-weight: $fw-semibold;
    color: $text;
    font-size: $fs-md;
  }

  .sched__day-short {
    display: none;

    @media (max-width: #{$bp-md - 1px}) {
      display: inline;
    }
  }

  .sched__day-full {
    @media (max-width: #{$bp-md - 1px}) {
      display: none;
    }
  }

  .sched__slots {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .sched__empty {
    font-size: $fs-sm;
    color: $muted;
  }

  .range {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2;

    input[type='time'] {
      min-height: 40px;
      padding: 0 $space-3;
      background: $surface;
      border: 1px solid $border;
      border-radius: $radius-md;
      font-size: $fs-sm;
      color: $text;
      font-variant-numeric: tabular-nums;

      &:focus-visible {
        outline: none;
        border-color: $plum;
        box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
      }
    }
  }

  .range__remove {
    background: transparent;
    border: 1px solid $border;
    color: $muted;
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $danger;
      border-color: color.adjust($danger, $lightness: 25%);
    }
  }

  .range__err {
    flex-basis: 100%;
    font-size: $fs-xs;
    color: $danger;
  }

  .sched__add {
    display: flex;
    justify-content: flex-end;
  }

  .sched__add-btn {
    background: transparent;
    border: 1px dashed $border;
    color: $muted;
    padding: 6px 12px;
    border-radius: $radius-pill;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    cursor: pointer;
    transition:
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $plum;
      border-color: $plum-soft;
    }
  }

  .sched__foot {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-4 $space-5;
    border-top: 1px solid $border;
    background: color.adjust($ivory, $lightness: -2%);

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  .sched__summary {
    font-size: $fs-sm;
    color: $muted;

    strong {
      color: $text;
      font-weight: $fw-semibold;
      margin-left: 6px;
    }
  }

  .sched__actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
  }

  .btn-primary {
    background: $plum;
    color: $white;
    border: 0;
    padding: 10px 18px;
    border-radius: $radius-md;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);

    &:hover:not(:disabled) {
      background: color.adjust($plum, $lightness: 4%);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  .btn-ghost {
    background: transparent;
    color: $muted;
    border: 1px solid $border;
    padding: 10px 18px;
    border-radius: $radius-md;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-out);

    &:hover:not(:disabled) {
      color: $text;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  // Objetivos táctiles de 44px en móvil: los inputs de hora, el botón de
  // quitar franja y el de añadir franja.
  @media (max-width: #{$bp-lg - 1px}) {
    .range input[type='time'],
    .range__remove,
    .sched__add-btn {
      min-height: $touch-target;
    }

    .range__remove {
      width: $touch-target;
      height: $touch-target;
    }
  }
</style>
