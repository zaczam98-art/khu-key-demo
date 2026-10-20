import { Link } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState } from '../../components/ui';
import { db } from '../../lib/db';
import { formatDate } from '../../lib/dday';
import { useAsync } from '../../lib/hooks';
import { avgScore } from './MockResult';

// 지난 면접 연습 기록
export function MockHistory() {
  const { data: sessions, loading } = useAsync(() => db.mockSessions.orderBy('createdAt').reverse().toArray(), []);
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="지난 연습" back="/mock" />
      <div className="flex-1 px-4 pb-6 pt-1">
        {loading && <div className="card skeleton h-24" />}
        {!loading && !sessions?.length && <EmptyState expr="suit" title="아직 연습 기록이 없어" desc="첫 면접을 끝내면 점수와 근거가 여기에 쌓여." action={{ label: '면접 시작', to: '/mock' }} />}
        <ul className="space-y-2">
          {(sessions ?? []).map((s, i) => (
            <li key={s.id}>
              <Link to={`/mock/${s.id}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="tile bg-lavender text-title text-primary">{avgScore(s.scores)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-body font-semibold text-ink">
                      {s.company ? `${s.company} ` : ''}
                      {s.type} 면접
                    </span>
                    <Badge tone="line">{s.turns.length}문항</Badge>
                  </span>
                  <span className="block text-small text-muted">{formatDate(s.createdAt)}</span>
                </span>
                <Icon name="chevron" size={18} className="text-muted/60" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
