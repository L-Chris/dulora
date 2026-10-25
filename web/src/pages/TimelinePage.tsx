import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { EntryCard } from '../components/entry/EntryCard';
import { MOODS } from '../lib/enums';
import { friendlyDate } from '../lib/date';
import type { EntrySummary } from '../api/types';

const PAGE_SIZE = 20;

export function TimelinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagId = searchParams.get('tagId') ?? '';
  const mood = searchParams.get('mood') ?? '';

  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: api.listTags });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['entries', { tagId, mood }],
    queryFn: ({ pageParam }) =>
      api.listEntries({
        ...(tagId ? { tagId } : {}),
        ...(mood ? { mood } : {}),
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const items: EntrySummary[] = data?.pages.flatMap((p) => p.items) ?? [];
  const grouped = groupByDate(items);

  const setFilter = (key: 'tagId' | 'mood', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">时间线</h1>
        <button
          type="button"
          onClick={() => navigate('/entries/new')}
          className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          ✏️ 写日记
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={tagId}
          onChange={(e) => setFilter('tagId', e.target.value)}
          className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 outline-none focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">全部标签</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}（{t.entryCount}）
            </option>
          ))}
        </select>
        <select
          value={mood}
          onChange={(e) => setFilter('mood', e.target.value)}
          className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 outline-none focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">全部心情</option>
          {MOODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.emoji} {m.label}
            </option>
          ))}
        </select>
        {(tagId || mood) && (
          <Link to="/timeline" className="text-violet-600 hover:underline dark:text-violet-400">
            清除筛选
          </Link>
        )}
        <span className="ml-auto text-xs text-neutral-400">共 {data?.pages[0]?.total ?? 0} 篇</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-20 text-center text-neutral-400 dark:border-neutral-700">
          还没有日记，
          <Link to="/entries/new" className="text-violet-600 hover:underline dark:text-violet-400">
            写第一篇
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ date, entries }) => (
            <section key={date}>
              <h2 className="sticky top-0 z-[5] mb-2 bg-neutral-50/90 py-1 text-sm font-medium text-neutral-500 backdrop-blur dark:bg-neutral-950/90 dark:text-neutral-400">
                {friendlyDate(date)}
              </h2>
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </section>
          ))}
          {hasNextPage && (
            <button
              type="button"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
              className="mx-auto rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {isFetchingNextPage ? '加载中…' : '加载更多'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function groupByDate(items: EntrySummary[]): { date: string; entries: EntrySummary[] }[] {
  const groups: { date: string; entries: EntrySummary[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.entries.push(item);
    else groups.push({ date: item.date, entries: [item] });
  }
  return groups;
}
