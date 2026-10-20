import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character, type Expr } from './Character';
import { Icon } from './Icon';

export function BackButton({ to }: { to?: string }) {
  const nav = useNavigate();
  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={() => (to ? nav(to, { viewTransition: true }) : nav(-1))}
      className="press -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink"
    >
      <Icon name="back" size={24} />
    </button>
  );
}

export function TitleHeader({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center bg-canvas/95 px-4 backdrop-blur">
      <BackButton to={back} />
      <h1 className="flex-1 text-center text-heading text-ink">{title}</h1>
      <div className="flex w-11 justify-end">{right}</div>
    </header>
  );
}

// 모듈 첫 화면의 제목 줄 (뒤로 가기 없음)
export function PageTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between">
      <h1 className="text-title text-ink">{title}</h1>
      {right}
    </div>
  );
}

export function ChatHeader({ expr = 'default', name = '쿠키', back, online = true }: { expr?: Expr; name?: string; back?: string; online?: boolean }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-canvas/95 px-4 backdrop-blur">
      <BackButton to={back} />
      <Character expr={expr} size={38} className="rounded-full bg-lavender transition-opacity duration-base" />
      <div className="leading-tight">
        <div className="text-body font-semibold text-ink">{name}</div>
        <div className="flex items-center gap-1 text-caption text-muted">
          <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-base ${online ? 'bg-success' : 'bg-warn'}`} />
          {online ? '온라인' : '오프라인'}
        </div>
      </div>
    </header>
  );
}
