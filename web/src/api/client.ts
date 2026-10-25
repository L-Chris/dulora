import type {
  CalendarDay,
  EntryDetail,
  EntryInput,
  EntryListResult,
  SearchResultItem,
  Tag,
  TagWithCount,
} from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init.body
      ? { 'Content-Type': 'application/json', ...init.headers }
      : init.headers,
  });
  let payload: { message?: string; data?: T } | null = null;
  if (res.status !== 204) {
    payload = await res.json().catch(() => null);
  }
  if (!res.ok) {
    const message = payload?.message ?? `请求失败（HTTP ${res.status}）`;
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      window.location.href = '/login';
    }
    throw new ApiError(res.status, message);
  }
  return (payload?.data ?? null) as T;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const api = {
  // auth
  login: (password: string) =>
    request<{ loggedIn: boolean }>('/api/auth/login', { method: 'POST', ...json({ password }) }),
  logout: () => request<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ id: number }>('/api/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ changed: boolean }>('/api/auth/password', {
      method: 'POST',
      ...json({ oldPassword, newPassword }),
    }),

  // entries
  listEntries: (params: {
    from?: string;
    to?: string;
    tagId?: string;
    mood?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    return request<EntryListResult>(`/api/entries?${qs}`);
  },
  getEntry: (id: string) => request<EntryDetail>(`/api/entries/${id}`),
  createEntry: (input: EntryInput) =>
    request<EntryDetail>('/api/entries', { method: 'POST', ...json(input) }),
  updateEntry: (id: string, input: EntryInput) =>
    request<EntryDetail>(`/api/entries/${id}`, { method: 'PUT', ...json(input) }),
  deleteEntry: (id: string) =>
    request<{ deleted: boolean }>(`/api/entries/${id}`, { method: 'DELETE' }),

  // calendar
  calendar: (year: number, month: number) =>
    request<CalendarDay[]>(`/api/calendar?year=${year}&month=${month}`),

  // tags
  listTags: () => request<TagWithCount[]>('/api/tags'),
  createTag: (name: string, color?: string) =>
    request<Tag>('/api/tags', { method: 'POST', ...json({ name, color }) }),
  updateTag: (id: string, patch: { name?: string; color?: string | null }) =>
    request<Tag>(`/api/tags/${id}`, { method: 'PUT', ...json(patch) }),
  deleteTag: (id: string) => request<{ deleted: boolean }>(`/api/tags/${id}`, { method: 'DELETE' }),

  // search
  search: (q: string) => request<SearchResultItem[]>(`/api/search?q=${encodeURIComponent(q)}`),

  // settings
  getSettings: () => request<{ timezone: string }>('/api/settings'),
  updateSettings: (timezone: string) =>
    request<{ timezone: string }>('/api/settings', { method: 'POST', ...json({ timezone }) }),
};
