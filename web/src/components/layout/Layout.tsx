import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const NAV_ITEMS = [
  { to: '/', label: '日历', icon: '📅', end: true },
  { to: '/timeline', label: '时间线', icon: '📚', end: false },
  { to: '/tags', label: '标签', icon: '🏷️', end: false },
  { to: '/search', label: '搜索', icon: '🔍', end: false },
  { to: '/settings', label: '设置', icon: '⚙️', end: false },
];

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
      : 'text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800',
  ].join(' ');
}

export function Layout() {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen">
      {/* 侧边栏（移动端隐藏，用底部导航替代） */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="text-2xl">📔</span>
          <span className="text-lg font-semibold">日记</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>{theme === 'dark' ? '暗色' : '亮色'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <span>🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 移动端顶栏 */}
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
          <span className="font-semibold">📔 日记</span>
          <div className="flex gap-2">
            <button type="button" onClick={toggle} className="px-2 py-1 text-sm">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <button type="button" onClick={handleLogout} className="px-2 py-1 text-sm">
              🚪
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* 移动端底部导航 */}
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
                  isActive
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-neutral-500 dark:text-neutral-400',
                ].join(' ')
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
