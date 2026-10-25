import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { moodMeta, weatherMeta } from '../lib/enums';
import { friendlyDate, monthLabel, todayStr } from '../lib/date';

export function CalendarPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr());

  const { data: days = [], isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => api.calendar(year, month),
  });

  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  );
  const monthTotal = useMemo(() => days.reduce((s, d) => s + d.count, 0), [days]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    setSelectedDate(todayStr());
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            ←
          </button>
          <h1 className="min-w-32 text-center text-lg font-semibold">{monthLabel(year, month)}</h1>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            →
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 rounded-lg px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            今天
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>本月 {monthTotal} 篇</span>
          <button
            type="button"
            onClick={() => navigate('/entries/new')}
            className="rounded-lg bg-violet-600 px-4 py-1.5 font-medium text-white hover:bg-violet-700"
          >
            ✏️ 写日记
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          {isLoading ? (
            <div className="py-20 text-center text-neutral-400">加载中…</div>
          ) : (
            <MonthCalendar
              year={year}
              month={month}
              days={days}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
            />
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          {selectedDate ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">{friendlyDate(selectedDate)}</h2>
                <button
                  type="button"
                  title="这天写日记"
                  onClick={() => navigate(`/entries/new?date=${selectedDate}`)}
                  className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs text-white hover:bg-violet-700"
                >
                  + 写一篇
                </button>
              </div>
              {selectedDay && selectedDay.entries.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {selectedDay.entries.map((e) => {
                    const mood = moodMeta(e.mood);
                    const weather = weatherMeta(e.weather);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/entries/${e.id}`)}
                          className="w-full rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-neutral-800 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/5"
                        >
                          <div className="flex items-center gap-2">
                            {mood && <span title={mood.label}>{mood.emoji}</span>}
                            {weather && <span title={weather.label}>{weather.emoji}</span>}
                            <span className="truncate text-sm font-medium">
                              {e.title || '无标题'}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-neutral-400">
                  这一天还没有日记
                </p>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-neutral-400">点击日期查看当天的日记</p>
          )}
        </div>
      </div>
    </div>
  );
}
