/** Formatage francais (montants en centimes, dates affichees en Europe/Paris). */

export const PARIS_TZ = 'Europe/Paris';

const EURO = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const EURO_ROUND = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 9490 -> « 94,90 € » ; 8000 -> « 80 € » quand `compact` et montant rond. */
export function formatEuros(cents: number | null | undefined, compact = false): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return '—';
  }
  if (compact && cents % 100 === 0) {
    return EURO_ROUND.format(cents / 100);
  }
  return EURO.format(cents / 100);
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** « 15 décembre 2026 » */
export function formatDateLong(iso: string | null | undefined): string {
  const d = toDate(iso);
  return d
    ? new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, day: 'numeric', month: 'long', year: 'numeric' })
        .format(d)
        .replace(/^1 /, '1er ')
    : '—';
}

/** « 15 décembre 2026 à 23 h 59 » */
export function formatDateTimeLong(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) {
    return '—';
  }
  const date = formatDateLong(iso);
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, hour: '2-digit', minute: '2-digit' })
    .format(d)
    .replace(':', ' h ');
  return `${date} à ${time}`;
}

/** « 15/12/2026 23:59 » */
export function formatDateTimeShort(iso: string | null | undefined): string {
  const d = toDate(iso);
  return d
    ? new Intl.DateTimeFormat('fr-FR', {
        timeZone: PARIS_TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    : '—';
}

/** Date calendaire `YYYY-MM-DD` (sans fuseau) -> « 12/04/1990 ». */
export function formatPlainDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

function parisParts(date: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const out: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      out[p.type] = Number(p.value);
    }
  }
  return out;
}

/** Decalage (minutes) de Paris par rapport a UTC a l'instant donne. */
function parisOffsetMinutes(date: Date): number {
  const p = parisParts(date);
  const asUtc = Date.UTC(p['year'], p['month'] - 1, p['day'], p['hour'] % 24, p['minute'], p['second']);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** ISO UTC -> valeur d'un `<input type="datetime-local">` en heure de Paris. */
export function isoToParisLocalInput(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) {
    return '';
  }
  const p = parisParts(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p['year']}-${pad(p['month'])}-${pad(p['day'])}T${pad(p['hour'] % 24)}:${pad(p['minute'])}`;
}

/** Valeur `YYYY-MM-DDTHH:mm` saisie en heure de Paris -> ISO UTC. */
export function parisLocalInputToIso(local: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local ?? '');
  if (!m) {
    return null;
  }
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = naive - parisOffsetMinutes(new Date(naive)) * 60000;
  guess = naive - parisOffsetMinutes(new Date(guess)) * 60000;
  return new Date(guess).toISOString();
}

/** Date du jour a Paris au format `YYYY-MM-DD`. */
export function todayInParis(): string {
  const p = parisParts(new Date());
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p['year']}-${pad(p['month'])}-${pad(p['day'])}`;
}

/** Pluriel simple : plural(3, 'participation') -> « 3 participations ». */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n.toLocaleString('fr-FR')} ${n > 1 ? pluralForm : singular}`;
}

/** Texte provisoire du back (« À compléter », vide…) ? */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return true;
  }
  return /à compléter|a completer|à définir|a definir/i.test(value);
}
