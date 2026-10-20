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
    <nav className="sticky bottom-0 z-10 flex border-t border-lavender bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `press relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`transition-transform duration-200 ${isActive ? '-translate-y-0.5 scale-110' : ''}`}>
                <Icon name={tab.icon} size={22} />
              </span>
              {tab.label}
              <span className={`absolute bottom-0.5 h-1 w-1 rounded-full bg-primary transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
