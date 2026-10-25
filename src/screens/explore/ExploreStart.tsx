import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { useAppStore } from '../../store';

// 1. 직무 탐색 시작
const SPARKLES = [
  { left: '12%', top: '18%', size: 18, delay: '0.2s' },
  { left: '80%', top: '12%', size: 24, delay: '0.5s' },
  { left: '74%', top: '58%', size: 14, delay: '0.8s' },
  { left: '16%', top: '62%', size: 12, delay: '1.1s' },
];

export function ExploreStart() {
  const nav = useNavigate();
  const resetExplore = useAppStore((s) => s.resetExplore);
  const { data: hasLog } = useAsync(async () => ((await db.chatLogs.get('log:explore'))?.turns.length ?? 0) > 1, []);

  const restart = async () => {
    await db.chatLogs.delete('log:explore');
    resetExplore();
    nav('/explore/chat', { viewTransition: true });
  };

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-lavender via-canvas to-canvas px-5 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="flex justify-end">
        <Link to="/profile" viewTransition className="press flex min-h-[36px] items-center rounded-full bg-surface/80 px-3 text-small text-muted shadow-card">
          건너뛰기
        </Link>
      </div>
      <div className="relative flex flex-1 items-center justify-center py-6">
        {SPARKLES.map((s, i) => (
          <Icon key={i} name="sparkle" size={s.size} className="pop absolute text-primary/60" style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
        ))}
        <Character expr="smile" size={240} float />
      </div>
      <div className="card rise text-center" style={{ animationDelay: '120ms' }}>
        <h1 className="text-title text-ink">안녕! 나는 루다야 👋</h1>
        <p className="mt-3 whitespace-pre-line text-body text-muted">{'너와 함께 딱 맞는 직무를\n찾아볼게.\n편하게 이야기해줘!'}</p>
        <button type="button" onClick={() => nav('/explore/chat', { viewTransition: true })} className="btn-primary mt-6 w-full">
          {hasLog ? '이어서 이야기하기' : '직무 탐색 시작하기'}
          <Icon name="arrow" size={18} />
        </button>
        {hasLog && (
          <button type="button" onClick={() => void restart()} className="btn-ghost mt-2 w-full">
            <Icon name="refresh" size={14} />
            대화 기록을 지우고 새로 시작
          </button>
        )}
      </div>
    </div>
  );
}
