import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { TAG_COLORS } from '../lib/enums';
import type { TagWithCount } from '../api/types';

export function TagsPage() {
  const queryClient = useQueryClient();
  const { data: tags = [], isLoading } = useQuery({ queryKey: ['tags'], queryFn: api.listTags });
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['entries'] });
  };

  const createMutation = useMutation({
    mutationFn: () => api.createTag(newName.trim(), newColor),
    onSuccess: () => {
      setNewName('');
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; color?: string } }) =>
      api.updateTag(id, patch),
    onSuccess: () => {
      setEditingId(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTag(id),
    onSuccess: invalidate,
  });

  const startEdit = (tag: TagWithCount) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-4 text-lg font-semibold">标签</h1>

      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate()}
            placeholder="新标签名"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-violet-500 dark:border-neutral-700"
          />
          <div className="flex items-center gap-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={[
                  'h-5 w-5 rounded-full transition-transform',
                  newColor === c ? 'scale-125 ring-2 ring-neutral-400 ring-offset-1 dark:ring-offset-neutral-900' : '',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            创建
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-neutral-400">加载中…</div>
      ) : tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400 dark:border-neutral-700">
          还没有标签
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {editingId === tag.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editName.trim())
                        updateMutation.mutate({ id: tag.id, patch: { name: editName.trim() } });
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-violet-400 bg-transparent px-2 py-1 text-sm outline-none"
                  />
                  <button
                    type="button"
                    disabled={!editName.trim() || updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({ id: tag.id, patch: { name: editName.trim() } })
                    }
                    className="text-sm text-violet-600 disabled:opacity-40 dark:text-violet-400"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-sm text-neutral-400"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title="换颜色"
                        onClick={() => updateMutation.mutate({ id: tag.id, patch: { color: c } })}
                        className={[
                          'h-4 w-4 rounded-full',
                          (tag.color ?? TAG_COLORS[0]) === c ? 'ring-2 ring-neutral-400 ring-offset-1 dark:ring-offset-neutral-900' : 'opacity-40 hover:opacity-100',
                        ].join(' ')}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
                  <Link
                    to={`/timeline?tagId=${tag.id}`}
                    className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500 hover:bg-violet-100 hover:text-violet-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-violet-500/20"
                  >
                    {tag.entryCount} 篇
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="text-sm text-neutral-400 hover:text-violet-600"
                  >
                    重命名
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`删除标签「${tag.name}」？（不会删除日记本身）`))
                        deleteMutation.mutate(tag.id);
                    }}
                    className="text-sm text-neutral-400 hover:text-red-500"
                  >
                    删除
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
