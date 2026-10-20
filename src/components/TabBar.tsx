import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

// 하단 탭 5개 (CLAUDE.md 7절)
const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/explore', label: '직무 탐색', icon: 'compass' },
  { to: '/profile', label: '프로필', icon: 'user' },
  { to: '/essay', label: '자소서', icon: 'doc' },
  { to: '/mock', label: '면접', icon: 'mic' },
];

export function TabBar() {
  return (
    <nav className="flex shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]" aria-label="주요 메뉴">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          viewTransition
          className={({ isActive }) =>
            `press relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-caption transition-colors duration-fast ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`transition-transform duration-base ease-app ${isActive ? '-translate-y-0.5 scale-110' : ''}`}>
                <Icon name={tab.icon} size={22} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              {tab.label}
              <span className={`absolute bottom-1 h-1 w-1 rounded-full bg-primary transition-opacity duration-base ${isActive ? 'opacity-100' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
