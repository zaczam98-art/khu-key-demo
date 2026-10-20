import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character, type Expr } from './Character';

export function BackButton({ to }: { to?: string }) {
  const nav = useNavigate();
  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={() => (to ? nav(to) : nav(-1))}
      className="press -ml-2 flex h-10 w-10 items-center justify-center text-[26px] leading-none text-ink"
    >
      ‹
    </button>
  );
}

export function TitleHeader({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center bg-canvas/95 px-4 backdrop-blur">
      <BackButton to={back} />
      <h1 className="flex-1 text-center text-[17px] font-semibold text-ink">{title}</h1>
      <div className="flex w-10 justify-end">{right}</div>
    </header>
  );
}

export function ChatHeader({ expr = 'default', back, online = true }: { expr?: Expr; back?: string; online?: boolean }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-canvas/95 px-4 backdrop-blur">
      <BackButton to={back} />
      <Character expr={expr} size={38} className="rounded-full bg-lavender transition-opacity" />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-ink">쿠키</div>
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${online ? 'bg-success' : 'bg-warn'}`} />
          {online ? '온라인' : '오프라인'}
        </div>
      </div>
    </header>
  );
}
