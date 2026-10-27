import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon, type IconName } from '../../components/Icon';
import { CATEGORY_HINT, setBuild } from '../../lib/build';
import { db, type ExperienceCategory } from '../../lib/db';
import { CATEGORIES } from '../../lib/schema';
import { BuildHeader } from './BuildIntro';

// 2. 경험 카테고리 선택 (복수 선택)
export const CATEGORY_ICON: Record<ExperienceCategory, IconName> = {
  동아리: 'people', 학회: 'book', 학생회: 'building', 봉사: 'heart', 아르바이트: 'coin', 인턴십: 'briefcase', 공모전: 'award', '자격증·교육': 'doc', 기타: 'sparkle',
};

export function BuildCategories() {
  const nav = useNavigate();
  const [picked, setPicked] = useState<ExperienceCategory[]>([]);
  const toggle = (c: ExperienceCategory) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const next = async () => {
    if (!picked.length) return;
    setBuild({ categories: picked, index: 0 });
    await db.chatLogs.delete('log:interview');
    nav('/profile/build/chat', { viewTransition: true });
  };
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <BuildHeader step={2} back="/profile/build" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <div className="rise flex items-start gap-3">
          <Character expr="default" size={48} className="shrink-0 rounded-full bg-lavender" />
          <div className="bubble-bot">{'지금까지 해본 경험이 있는\n활동을 모두 선택해줘!\n(없어도 괜찮아. 나중에 추가할 수 있어😊)'}</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {CATEGORIES.map((c, i) => {
            const on = picked.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c)}
                className={`card rise press flex items-center gap-3 !p-4 text-left transition-shadow duration-fast ${on ? 'ring-2 ring-primary' : ''}`}
                style={{ animationDelay: `${80 + i * 40}ms` }}
              >
                <span className={`tile h-11 w-11 ${on ? 'bg-primary text-white' : 'bg-lavender text-primary'}`}>
                  <Icon name={CATEGORY_ICON[c]} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block text-body font-semibold text-ink">{c === '봉사' ? '봉사활동' : c}</span>
                  <span className="block truncate text-caption text-muted">({CATEGORY_HINT[c]})</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => void next()} disabled={!picked.length} className="btn-primary w-full">
          {picked.length ? `${picked.length}개 골랐어. 다음` : '다음'}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
