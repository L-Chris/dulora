import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';

function allTimezones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  try {
    if (typeof intl.supportedValuesOf === 'function') {
      return intl.supportedValuesOf('timeZone');
    }
  } catch {
    /* ignore */
  }
  return [
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney',
    'UTC',
  ];
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: api.getSettings });
  const timezones = useMemo(allTimezones, []);

  const [timezone, setTimezone] = useState<string | null>(null);
  const tzValue = timezone ?? settings?.timezone ?? 'Asia/Shanghai';
  const [tzSaved, setTzSaved] = useState(false);

  const tzMutation = useMutation({
    mutationFn: (tz: string) => api.updateSettings(tz),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setTzSaved(true);
      setTimeout(() => setTzSaved(false), 2000);
    },
  });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const pwdMutation = useMutation({
    mutationFn: () => api.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setPwdMessage({ ok: true, text: '密码已修改' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e: unknown) => {
      setPwdMessage({ ok: false, text: e instanceof ApiError ? e.message : '修改失败' });
    },
  });

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwdMessage({ ok: false, text: '新密码至少 6 位' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMessage({ ok: false, text: '两次输入的新密码不一致' });
      return;
    }
    pwdMutation.mutate();
  };

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 dark:border-neutral-700';

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <h1 className="mb-4 text-lg font-semibold">设置</h1>

      <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-medium">时区</h2>
        <p className="mb-3 text-xs text-neutral-400">决定「今天」的归属日（新日记的默认日期）</p>
        <div className="flex items-center gap-2">
          <input
            list="timezone-options"
            value={tzValue}
            onChange={(e) => {
              setTimezone(e.target.value);
              setTzSaved(false);
            }}
            className={inputClass}
          />
          <datalist id="timezone-options">
            {timezones.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
          <button
            type="button"
            disabled={tzValue === settings?.timezone || tzMutation.isPending}
            onClick={() => tzMutation.mutate(tzValue)}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
          >
            {tzSaved ? '已保存 ✓' : '保存'}
          </button>
        </div>
        {tzMutation.isError && (
          <p className="mt-2 text-sm text-red-500">
            {tzMutation.error instanceof ApiError ? tzMutation.error.message : '保存失败'}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 font-medium">修改密码</h2>
        <form onSubmit={submitPassword} className="flex flex-col gap-2">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="原密码"
            autoComplete="current-password"
            className={inputClass}
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新密码（至少 6 位）"
            autoComplete="new-password"
            className={inputClass}
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
            autoComplete="new-password"
            className={inputClass}
            required
          />
          {pwdMessage && (
            <p className={pwdMessage.ok ? 'text-sm text-emerald-500' : 'text-sm text-red-500'}>
              {pwdMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pwdMutation.isPending || !oldPassword || !newPassword || !confirmPassword}
            className="mt-1 self-start rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
          >
            {pwdMutation.isPending ? '提交中…' : '修改密码'}
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
        <p>数据说明：日记保存在你自己的服务器（SQLite），退出登录不会清除本地主题偏好。</p>
      </section>
    </div>
  );
}
