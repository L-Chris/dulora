export const MOODS = ['great', 'good', 'ok', 'bad', 'terrible'] as const;
export const WEATHERS = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy'] as const;
export type Mood = (typeof MOODS)[number];
export type Weather = (typeof WEATHERS)[number];
