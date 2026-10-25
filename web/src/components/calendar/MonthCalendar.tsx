import type { CalendarDay } from '../../api/types';
import { moodMeta } from '../../lib/enums';
import { daysInMonth, leadingBlanks, todayStr } from '../../lib/date';

interface MonthCalendarProps {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const WEEKDAY_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];

export function MonthCalendar({ year, month, days, selectedDate, onSelectDate }: MonthCalendarProps) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const total = daysInMonth(year, month);
  const blanks = leadingBlanks(year, month);
  const today = todayStr();

  const cells: (string | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: total }, (_, i) => `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      <div className="mb-1 grid grid-cols-7 text-center text-xs text-neutral-400 dark:text-neutral-500">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`b${i}`} className="min-h-16 rounded-lg" />;
          const day = byDate.get(date);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const dayNum = Number(date.slice(-2));
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={[
                'flex min-h-16 flex-col items-start gap-0.5 rounded-lg border p-1.5 text-left transition-colors',
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                  : 'border-transparent hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday
                    ? 'bg-violet-600 font-semibold text-white'
                    : 'text-neutral-600 dark:text-neutral-300',
                ].join(' ')}
              >
                {dayNum}
              </span>
              {day && (
                <span className="flex w-full items-center justify-between gap-0.5">
                  <span className="flex overflow-hidden">
                    {day.moods.slice(0, 3).map((m, j) => (
                      <span key={j} className="text-[10px] leading-none">{moodMeta(m)?.emoji}</span>
                    ))}
                  </span>
                  <span className="rounded-full bg-neutral-200 px-1 text-[10px] leading-4 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {day.count}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
