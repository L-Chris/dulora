import { Link } from 'react-router-dom';
import type { EntrySummary } from '../../api/types';
import { moodMeta, weatherMeta } from '../../lib/enums';
import { friendlyDate, formatTime } from '../../lib/date';

interface EntryCardProps {
  entry: EntrySummary;
  onDelete?: (id: string) => void;
}

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const mood = moodMeta(entry.mood);
  const weather = weatherMeta(entry.weather);
  return (
    <div className="group relative rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Link to={`/entries/${entry.id}`} className="block">
        <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
          <span>{friendlyDate(entry.date)}</span>
          <span>{formatTime(entry.createdAt)}</span>
          {mood && <span title={mood.label}>{mood.emoji}</span>}
          {weather && <span title={weather.label}>{weather.emoji}</span>}
        </div>
        <h3 className="mb-1 font-medium">
          {entry.title || <span className="text-neutral-400">无标题</span>}
        </h3>
        {entry.excerpt && (
          <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
            {entry.excerpt}
          </p>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-[11px] text-white"
                style={{ backgroundColor: tag.color ?? '#8b5cf6' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </Link>
      {onDelete && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('确定删除这篇日记吗？')) onDelete(entry.id);
          }}
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs text-neutral-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-500/10"
        >
          删除
        </button>
      )}
    </div>
  );
}
