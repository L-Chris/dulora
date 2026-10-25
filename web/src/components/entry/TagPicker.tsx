import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { TAG_COLORS } from '../../lib/enums';

interface TagPickerProps {
  selected: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ selected, onChange }: TagPickerProps) {
  const queryClient = useQueryClient();
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: api.listTags });
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      api.createTag(newName.trim(), TAG_COLORS[tags.length % TAG_COLORS.length]),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      if (!selected.includes(tag.id)) onChange([...selected, tag.id]);
      setNewName('');
      setCreating(false);
    },
  });

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={[
              'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors',
              active
                ? 'border-transparent text-white'
                : 'border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400',
            ].join(' ')}
            style={active ? { backgroundColor: tag.color ?? '#8b5cf6' } : undefined}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: active ? 'rgba(255,255,255,0.8)' : (tag.color ?? '#8b5cf6') }}
            />
            {tag.name}
          </button>
        );
      })}
      {creating ? (
        <span className="flex items-center gap-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) createMutation.mutate();
              if (e.key === 'Escape') setCreating(false);
            }}
            placeholder="标签名"
            className="w-20 rounded-full border border-violet-400 bg-transparent px-2.5 py-0.5 text-xs outline-none"
          />
          <button
            type="button"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="text-xs text-violet-600 disabled:opacity-40 dark:text-violet-400"
          >
            确定
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-full border border-dashed border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-500 hover:border-violet-400 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-400"
        >
          + 标签
        </button>
      )}
    </div>
  );
}
