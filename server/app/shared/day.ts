// 时区感知的「日记日」计算（参考 flashnext day-boundary.js 的简化版）
// 日记按自然日归属，无日切点需求；date 一律为 yyyy-MM-dd 字符串，
// 字典序即时间序，范围查询直接字符串比较。

export function dateInTz(timeZone: string, at: Date = new Date()): string {
  // en-CA 输出即 yyyy-MM-dd
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

export function isValidDateStr(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function monthRange(year: number, month: number): { from: string; to: string } {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` };
}
