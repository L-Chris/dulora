import { weatherMeta } from '../../lib/enums';
import type { Weather } from '../../lib/enums';

interface WeatherPickerProps {
  value: Weather | null;
  onChange: (weather: Weather | null) => void;
}

export function WeatherPicker({ value, onChange }: WeatherPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {(['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy'] as const).map((w) => {
        const meta = weatherMeta(w)!;
        const active = value === w;
        return (
          <button
            key={w}
            type="button"
            title={meta.label}
            onClick={() => onChange(active ? null : w)}
            className={[
              'rounded-lg px-2 py-1 text-xl transition-all',
              active
                ? 'scale-110 bg-sky-100 dark:bg-sky-500/20'
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
