const PAD = (n: number): string => String(n).padStart(2, '0');

export function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}T${PAD(d.getHours())}:${PAD(d.getMinutes())}:${PAD(d.getSeconds())}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}`;
}

export function parseLocal(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(iso);
  if (!m) {
    const fallback = new Date(iso);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  const [, y, mo, d, h, mi, s] = m;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? '0'),
    0
  );
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short'
});

const dateLongFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

const dateMonthFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short'
});

export function fmtTime(iso: string): string {
  return timeFormatter.format(parseLocal(iso));
}

export function fmtDate(iso: string): string {
  return dateFormatter.format(parseLocal(iso));
}

export function fmtDateLong(input: string | Date): string {
  const d = typeof input === 'string' ? parseLocal(input) : input;
  return dateLongFormatter.format(d);
}

export function fmtDateShort(input: string | Date): string {
  const d = typeof input === 'string' ? parseLocal(input) : input;
  return dateMonthFormatter.format(d);
}

export function isFuture(iso: string): boolean {
  return parseLocal(iso).getTime() >= Date.now();
}

export function localDateTimeMinusNow(iso: string): number {
  return Math.round((parseLocal(iso).getTime() - Date.now()) / 60_000);
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60_000);
}