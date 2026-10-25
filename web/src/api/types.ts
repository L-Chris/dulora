import type { Mood, Weather } from '../lib/enums';

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface TagWithCount extends Tag {
  entryCount: number;
  createdAt: string;
}

export interface EntrySummary {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  mood: Mood | null;
  weather: Weather | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface EntryDetail {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: Mood | null;
  weather: Weather | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface EntryListResult {
  items: EntrySummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CalendarDayEntry {
  id: string;
  date: string;
  title: string;
  mood: Mood | null;
  weather: Weather | null;
  createdAt: string;
}

export interface CalendarDay {
  date: string;
  count: number;
  moods: Mood[];
  entries: CalendarDayEntry[];
}

export interface SearchResultItem {
  id: string;
  date: string;
  title: string;
  mood: Mood | null;
  weather: Weather | null;
  tags: Tag[];
  snippet: string;
}

export interface EntryInput {
  date?: string;
  title?: string;
  content?: string;
  mood?: Mood | '' | null;
  weather?: Weather | '' | null;
  tagIds?: string[];
}
