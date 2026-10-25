import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';

export function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      await login(password);
      // AuthProvider 状态变化后 GuestOnly 会自动跳转 /
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败，请重试');
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-neutral-50 to-sky-50 p-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">📔</div>
          <h1 className="text-xl font-semibold">我的日记</h1>
          <p className="mt-1 text-sm text-neutral-400">输入密码解锁你的回忆</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          autoFocus
          className="mb-3 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none transition-colors focus:border-violet-500 dark:border-neutral-700"
        />
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={!password || pending}
          className="w-full rounded-lg bg-violet-600 py-2 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  );
}
