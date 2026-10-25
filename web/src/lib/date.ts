const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function todayStr(): string {
  const d = new Date();
  return dateStr(d);
}

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseDateStr(s);
  return !Number.isNaN(d.getTime()) && dateStr(d) === s;
}

export function weekdayCn(s: string): string {
  const d = parseDateStr(s).getDay();
  return `周${WEEKDAYS[(d + 6) % 7]}`;
}

/** 今天 / 昨天 / 2026年10月23日 周五 */
export function friendlyDate(s: string): string {
  const today = todayStr();
  const yest = dateStr(new Date(Date.now() - 86400000));
  if (s === today) return '今天';
  if (s === yest) return '昨天';
  const d = parseDateStr(s);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdayCn(s)}`;
}

export function monthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 周一为一周起点时，当月 1 号前面的空格数 */
export function leadingBlanks(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
