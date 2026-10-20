import { Link } from 'react-router-dom';
import { PageTitle } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState } from '../../components/ui';
import { db, type Stage } from '../../lib/db';
import { daysUntil, ddayLabel } from '../../lib/dday';
import { useAsync } from '../../lib/hooks';

// 자소서 허브: 지원 건 목록. 마감이 가까운 순서입니다.
const STAGE_TONE: Record<Stage, 'line' | 'soft' | 'solid' | 'success' | 'danger' | 'warn'> = {
  관심: 'line', 작성중: 'soft', 제출: 'solid', 서류합격: 'success', 서류불합격: 'danger', 면접: 'warn', 최종: 'success',
};

export function EssayHub() {
  const { data: apps, loading } = useAsync(() => db.applications.toArray(), []);
  const sorted = [...(apps ?? [])].sort((a, b) => {
    const da = a.deadline ? daysUntil(a.deadline) : 9999;
    const dbb = b.deadline ? daysUntil(b.deadline) : 9999;
    return da - dbb;
  });

  return (
    <div className="flex min-h-full flex-col px-4 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <PageTitle
        title="자소서"
        right={
          <Link to="/essay/new" viewTransition className="btn-primary min-h-[40px] px-4 text-small">
            <Icon name="plus" size={16} />
            지원 추가
          </Link>
        }
      />
      {loading && <div className="card mt-4 skeleton h-24" />}
      {!loading && sorted.length === 0 && (
        <div className="mt-4">
          <EmptyState expr="smile" title="첫 지원 건을 추가해 보자" desc={'공고 링크를 넣으면 키워드와 문항을\n쿠키가 뽑아 줘.'} action={{ label: '지원 건 추가', to: '/essay/new' }} />
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {sorted.map((a, i) => {
          const done = a.questions.filter((q) => q.status === '완료').length;
          const d = a.deadline ? daysUntil(a.deadline) : null;
          return (
            <li key={a.id}>
              <Link to={`/essay/${a.id}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${i * 70}ms` }}>
                <span className={`tile ${d !== null && d <= 3 && d >= 0 ? 'bg-warn/15 text-warn' : 'bg-lavender text-primary'} flex-col gap-0 text-caption font-bold`}>
                  <span className="text-[0.75rem] leading-none">{ddayLabel(a.deadline)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-body font-semibold text-ink">{a.company}</span>
                    <Badge tone={STAGE_TONE[a.stage]}>{a.stage}</Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-small text-muted">
                    {a.job} · 문항 {done}/{a.questions.length} 완료
                  </span>
                </span>
                <Icon name="chevron" size={18} className="text-muted/60" />
              </Link>
            </li>
          );
        })}
      </ul>
      {!loading && sorted.length > 0 && <p className="mt-6 text-center text-caption text-muted">지원 건을 누르면 문항별 초안과 체크리스트를 볼 수 있어요.</p>}
    </div>
  );
}
