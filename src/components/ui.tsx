import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Character, type Expr } from './Character';
import { Icon, type IconName } from './Icon';

// 화면 공통 조각. 새 화면은 여기 있는 것부터 씁니다.

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title">{children}</h2>
      {right}
    </div>
  );
}

export function Badge({ tone = 'soft', children }: { tone?: 'soft' | 'solid' | 'line' | 'warn' | 'success' | 'danger'; children: ReactNode }) {
  const cls = {
    soft: 'bg-lavender text-primary',
    solid: 'bg-primary text-white',
    line: 'border border-line bg-surface text-muted',
    warn: 'bg-warn/15 text-warn',
    success: 'bg-success/15 text-success',
    danger: 'bg-danger/15 text-danger',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold ${cls}`}>{children}</span>;
}

export function ToggleChip({ on, onClick, children, icon }: { on: boolean; onClick: () => void; children: ReactNode; icon?: IconName }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`chip press ${on ? 'chip-on' : ''}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-caption text-muted">{hint}</span>}
    </label>
  );
}

export function ScoreBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const tone = v >= 80 ? 'bg-success' : v >= 60 ? 'bg-primary' : 'bg-warn';
  return (
    <div className="rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between text-small">
        <span className="text-ink">{label}</span>
        <span className="font-semibold tabular-nums text-ink">{v}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-lavender">
        <div className={`h-full rounded-full ${tone} transition-[width] duration-slow ease-app`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ expr = 'wink', title, desc, action }: { expr?: Expr; title: string; desc?: string; action?: { label: string; to: string } }) {
  return (
    <div className="card rise flex flex-col items-center py-8 text-center">
      <Character expr={expr} size={96} float className="rounded-full bg-lavender" />
      <p className="mt-4 text-heading text-ink">{title}</p>
      {desc && <p className="mt-1 whitespace-pre-line text-small text-muted">{desc}</p>}
      {action && (
        <Link to={action.to} className="btn-primary mt-5 px-6">
          {action.label}
          <Icon name="arrow" size={16} />
        </Link>
      )}
    </div>
  );
}

// 아래에서 올라오는 시트. 배경을 누르거나 닫기 버튼으로 닫습니다.
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="닫기" onClick={onClose} className="fade-in absolute inset-0 bg-ink/40" />
      <div className="slide-up relative w-full max-w-[420px] rounded-t-[24px] bg-surface p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-pop">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading text-ink">{title}</h2>
          <button type="button" aria-label="닫기" onClick={onClose} className="press flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-muted">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`spin inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

export function ListRow({ icon, title, sub, right, to, onClick, delay = 0 }: { icon: IconName; title: ReactNode; sub?: ReactNode; right?: ReactNode; to?: string; onClick?: () => void; delay?: number }) {
  const body = (
    <>
      <span className="tile bg-lavender text-primary">
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-ink">{title}</span>
        {sub && <span className="mt-0.5 block text-small text-muted">{sub}</span>}
      </span>
      {right ?? <Icon name="chevron" size={18} className="text-muted/60" />}
    </>
  );
  const cls = 'card rise press flex w-full items-center gap-3 text-left';
  const style = { animationDelay: `${delay}ms` };
  if (to) return <Link to={to} className={cls} style={style}>{body}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {body}
    </button>
  );
}
