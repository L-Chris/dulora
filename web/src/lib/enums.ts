export const MOODS = [
  { value: 'great', emoji: '😄', label: '很棒' },
  { value: 'good', emoji: '🙂', label: '不错' },
  { value: 'ok', emoji: '😐', label: '一般' },
  { value: 'bad', emoji: '🙁', label: '低落' },
  { value: 'terrible', emoji: '😫', label: '糟糕' },
] as const;

export const WEATHERS = [
  { value: 'sunny', emoji: '☀️', label: '晴' },
  { value: 'cloudy', emoji: '⛅', label: '多云' },
  { value: 'rainy', emoji: '🌧️', label: '雨' },
  { value: 'snowy', emoji: '❄️', label: '雪' },
  { value: 'windy', emoji: '🌬️', label: '风' },
  { value: 'foggy', emoji: '🌫️', label: '雾' },
] as const;

export type Mood = (typeof MOODS)[number]['value'];
export type Weather = (typeof WEATHERS)[number]['value'];

export function moodMeta(value: string | null | undefined) {
  return MOODS.find((m) => m.value === value) ?? null;
}

export function weatherMeta(value: string | null | undefined) {
  return WEATHERS.find((w) => w.value === value) ?? null;
}

export const TAG_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6b7280',
];
