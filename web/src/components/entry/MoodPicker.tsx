import { moodMeta } from '../../lib/enums';
import type { Mood } from '../../lib/enums';

interface MoodPickerProps {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {(['great', 'good', 'ok', 'bad', 'terrible'] as const).map((m) => {
        const meta = moodMeta(m)!;
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            title={meta.label}
            onClick={() => onChange(active ? null : m)}
            className={[
              'rounded-lg px-2 py-1 text-xl transition-all',
              active
                ? 'scale-110 bg-violet-100 dark:bg-violet-500/20'
                : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0',
            ].join(' ')}
          >
            {meta.emoji}
          </button>
        );
      })}
    </div>
  );
}
