import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { DiaryEditor, editorHasText } from '../components/editor/DiaryEditor';
import { MoodPicker } from '../components/entry/MoodPicker';
import { WeatherPicker } from '../components/entry/WeatherPicker';
import { TagPicker } from '../components/entry/TagPicker';
import type { EntryDetail, EntryInput } from '../api/types';
import type { Mood, Weather } from '../lib/enums';
import { isValidDateStr, todayStr } from '../lib/date';

type SaveState = 'saved' | 'saving' | 'dirty' | 'error';

const SAVE_STATE_LABEL: Record<SaveState, string> = {
  saved: '已保存',
  saving: '保存中…',
  dirty: '未保存',
  error: '保存失败',
};

export function EntryEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const { data: entry, isLoading, isError } = useQuery({
    queryKey: ['entry', id],
    queryFn: () => api.getEntry(id!),
    enabled: !isNew,
  });

  if (isNew) {
    return <EntryForm key="new" />;
  }
  if (isLoading) {
    return <div className="p-10 text-center text-neutral-400">加载中…</div>;
  }
  if (isError || !entry) {
    return <div className="p-10 text-center text-red-400">日记不存在或加载失败</div>;
  }
  return <EntryForm key={entry.id} entry={entry} />;
}

function EntryForm({ entry }: { entry?: EntryDetail }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState(entry?.title ?? '');
  const [date, setDate] = useState(entry?.date ?? searchParams.get('date') ?? todayStr());
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [weather, setWeather] = useState<Weather | null>(entry?.weather ?? null);
  const [tagIds, setTagIds] = useState<string[]>(entry?.tags.map((t) => t.id) ?? []);
  const [saveState, setSaveState] = useState<SaveState>('saved');

  const idRef = useRef<string | null>(entry?.id ?? null);
  const contentRef = useRef<string>(entry?.content ?? '[]');
  const metaRef = useRef({ title, date, mood, weather, tagIds });
  metaRef.current = { title, date, mood, weather, tagIds };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewEntry = !entry;

  const doSave = useCallback(async () => {
    const meta = metaRef.current;
    const content = contentRef.current;
    if (!idRef.current && !meta.title.trim() && !editorHasText(content)) return; // 空日记不落库
    if (!isValidDateStr(meta.date)) return;

    setSaveState('saving');
    try {
      if (idRef.current) {
        const payload: EntryInput = {
          title: meta.title,
          date: meta.date,
          content,
          mood: meta.mood ?? '',
          weather: meta.weather ?? '',
          tagIds: meta.tagIds,
        };
        await api.updateEntry(idRef.current, payload);
        queryClient.invalidateQueries({ queryKey: ['entry', idRef.current] });
      } else {
        const payload: EntryInput = {
          title: meta.title,
          date: meta.date,
          content,
          tagIds: meta.tagIds,
          ...(meta.mood ? { mood: meta.mood } : {}),
          ...(meta.weather ? { weather: meta.weather } : {}),
        };
        const created = await api.createEntry(payload);
        idRef.current = created.id;
        // 用 replaceState 更新 URL，避免路由切换导致编辑器重挂载
        window.history.replaceState({}, '', `/entries/${created.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [queryClient]);

  const scheduleSave = useCallback(() => {
    setSaveState('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void doSave(), 800);
  }, [doSave]);

  // 元数据变化 → 防抖保存（仅已落库的日记；新日记等正文非空后由首次保存创建）
  useEffect(() => {
    if (!idRef.current) {
      if (!metaRef.current.title.trim() && !editorHasText(contentRef.current)) return;
    }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, date, mood, weather, tagIds]);

  // Cmd/Ctrl+S 立即保存；Cmd/Ctrl+Enter 保存并返回
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 's') {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        void doSave();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        void doSave().then(() => navigate(-1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doSave, navigate]);

  // 卸载时若有未保存内容，尝试同步保存
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void doSave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditorChange = (blocksJson: string) => {
    contentRef.current = blocksJson;
    scheduleSave();
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          ← 返回
        </button>
        <span
          className={[
            'text-xs',
            saveState === 'error'
              ? 'text-red-500'
              : saveState === 'saved'
                ? 'text-emerald-500'
                : 'text-neutral-400',
          ].join(' ')}
        >
          {SAVE_STATE_LABEL[saveState]}
        </span>
        <span className="ml-auto hidden text-xs text-neutral-400 md:block">
          ⌘S 保存 · ⌘↵ 保存并返回
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <MoodPicker value={mood} onChange={setMood} />
        <WeatherPicker value={weather} onChange={setWeather} />
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题（可选）"
        maxLength={300}
        className="mb-2 w-full border-none bg-transparent px-1 text-2xl font-semibold outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
      />

      <div className="mb-4 px-1">
        <TagPicker selected={tagIds} onChange={setTagIds} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
        <DiaryEditor
          initialContent={isNewEntry ? undefined : entry?.content}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
