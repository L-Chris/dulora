import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { moodMeta, weatherMeta } from '../lib/enums';
import { friendlyDate } from '../lib/date';

/** 服务端 snippet 用 <mark> 标记命中词，这里按标记拆分渲染（无 HTML 注入） */
function Snippet({ text }: { text: string }) {
  const parts = text.split(/<mark>|<\/mark>/);
  return (
    <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/40">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('q') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  // 300ms 防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(input.trim());
      const next = new URLSearchParams(searchParams);
      if (input.trim()) next.set('q', input.trim());
      else next.delete('q');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q),
    enabled: q.length > 0,
  });

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-4 text-lg font-semibold">搜索</h1>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="搜索日记内容…（支持中文）"
        autoFocus
        className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 outline-none transition-colors focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
      />

      {q.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">输入关键词开始搜索</p>
      ) : isFetching && !results ? (
        <p className="py-16 text-center text-sm text-neutral-400">搜索中…</p>
      ) : results && results.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">没有找到「{q}」相关的日记</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(results ?? []).map((r) => {
            const mood = moodMeta(r.mood);
            const weather = weatherMeta(r.weather);
            return (
              <li key={r.id}>
                <Link
                  to={`/entries/${r.id}`}
                  className="block rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
                    <span>{friendlyDate(r.date)}</span>
                    {mood && <span>{mood.emoji}</span>}
                    {weather && <span>{weather.emoji}</span>}
                    {r.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full px-1.5 py-0.5 text-[10px] text-white"
                        style={{ backgroundColor: t.color ?? '#8b5cf6' }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="mb-1 font-medium">
                    {r.title || <span className="text-neutral-400">无标题</span>}
                  </h3>
                  <Snippet text={r.snippet} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
