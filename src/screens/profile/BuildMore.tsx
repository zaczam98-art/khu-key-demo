import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';
import { setBuild } from '../../lib/build';
import { db } from '../../lib/db';
import { periodLabel } from '../../lib/experience';
import { useAsync } from '../../lib/hooks';
import { CATEGORY_ICON } from './BuildCategories';
import { BuildHeader } from './BuildIntro';

// 6. 다른 경험 추가
export function BuildMore() {
  const nav = useNavigate();
  const { data: cards } = useAsync(() => db.experiences.orderBy('createdAt').reverse().toArray(), []);
  const addMore = () => {
    setBuild({ categories: [], index: 0 });
    nav('/profile/build/categories', { viewTransition: true });
  };
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <BuildHeader step={4} back="/profile" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <div className="rise flex items-start gap-3">
          <Character expr="smile" size={48} className="shrink-0 rounded-full bg-lavender" />
          <div className="bubble-bot">{'다른 경험도 더 추가해볼까?\n아니면 이제 그만할까?'}</div>
        </div>
        <ul className="mt-5 space-y-2">
          {(cards ?? []).map((c, i) => (
            <li key={c.id}>
              <Link to={`/profile/experience/${c.id}`} viewTransition className="card rise press flex items-center gap-3 !p-3" style={{ animationDelay: `${100 + i * 60}ms` }}>
                <span className="tile h-10 w-10 bg-lavender text-primary">
                  <Icon name={CATEGORY_ICON[c.category]} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-ink">{c.title}</span>
                  <span className="block text-caption text-muted">{periodLabel(c.period)}</span>
                </span>
                <span className="text-small text-primary">수정</span>
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addMore} className="btn-secondary rise mt-4 w-full" style={{ animationDelay: '300ms' }}>
          <Icon name="plus" size={18} />
          경험 추가하기
        </button>
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => nav('/profile/build/analysis', { viewTransition: true })} disabled={!cards?.length} className="btn-primary w-full">
          다음
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
