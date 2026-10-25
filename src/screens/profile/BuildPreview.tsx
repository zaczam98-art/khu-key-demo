import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon, type IconName } from '../../components/Icon';
import { PREVIEW_GROUPS, setBuild } from '../../lib/build';
import { db } from '../../lib/db';
import { periodLabel } from '../../lib/experience';
import { useAsync } from '../../lib/hooks';
import { CATEGORY_ICON } from './BuildCategories';
import { BuildHeader } from './BuildIntro';

// 8. 프로필 미리보기 (탭: 전체 / 활동 / 아르바이트 / 자격증·교육)
export function BuildPreview() {
  const nav = useNavigate();
  const { data: cards } = useAsync(() => db.experiences.orderBy('createdAt').reverse().toArray(), []);
  const [tab, setTab] = useState('전체');
  const all = cards ?? [];
  const groups = [{ label: '전체', items: all }, ...PREVIEW_GROUPS.map((g) => ({ label: g.label, items: all.filter((c) => g.categories.includes(c.category)) })).filter((g) => g.items.length)];
  const items = groups.find((g) => g.label === tab)?.items ?? all;
  const addMore = () => {
    setBuild({ categories: [], index: 0 });
    nav('/profile/build/categories', { viewTransition: true });
  };
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="내 프로필 미리보기" back="/profile/build/analysis" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((g) => (
            <button key={g.label} type="button" aria-pressed={tab === g.label} onClick={() => setTab(g.label)} className={`chip press shrink-0 ${tab === g.label ? 'chip-on' : ''}`}>
              {g.label} <span className={tab === g.label ? 'text-white/80' : 'text-muted'}>{g.items.length}</span>
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {items.map((c, i) => (
            <li key={c.id}>
              <Link to={`/profile/experience/${c.id}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <span className="tile bg-lavender text-primary">
                  <Icon name={CATEGORY_ICON[c.category]} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-ink">{c.title}</span>
                  <span className="block text-caption text-muted">{periodLabel(c.period)}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {c.skills.slice(0, 3).map((s) => (
                      <span key={s} className="tag">
                        #{s}
                      </span>
                    ))}
                  </span>
                </span>
                <Icon name="chevron" size={18} className="text-muted/60" />
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addMore} className="btn-secondary rise mt-4 w-full" style={{ animationDelay: '300ms' }}>
          <Icon name="plus" size={18} />
          경험 더 추가하기
        </button>
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => nav('/profile/build/usage', { viewTransition: true })} className="btn-primary w-full">
          다음
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}

// 9. 활용 예시 안내
const USAGE: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'doc', title: '자소서 작성 시', desc: '경험과 지원 직무에 맞는 문항 추천' },
  { icon: 'mic', title: '면접 준비 시', desc: '내 경험을 기반으로 맞춤형 질문 생성' },
  { icon: 'briefcase', title: '채용공고 추천 시', desc: '내 경험과 강점을 고려한 공고 추천' },
  { icon: 'refresh', title: '프로필은 언제든지', desc: '수정하거나 새로운 경험을 추가할 수 있어!' },
];
export function BuildUsage() {
  const nav = useNavigate();
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <BuildHeader step={5} back="/profile/build/preview" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <div className="rise flex items-start gap-3">
          <Character expr="wink" size={48} className="shrink-0 rounded-full bg-lavender" />
          <div className="bubble-bot">{'이렇게 정리된 경험은\n앞으로 자소서 작성, 면접 준비,\n채용공고 추천 등에 활용돼!\n예를 들어...'}</div>
        </div>
        <ul className="card rise mt-5 space-y-4" style={{ animationDelay: '120ms' }}>
          {USAGE.map((u, i) => (
            <li key={u.title} className="rise flex items-start gap-3" style={{ animationDelay: `${200 + i * 90}ms` }}>
              <span className="tile h-10 w-10 bg-lavender text-primary">
                <Icon name={u.icon} size={20} />
              </span>
              <span>
                <span className="block text-body font-semibold text-ink">{u.title}</span>
                <span className="block text-small text-muted">{u.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => nav('/profile/build/done', { viewTransition: true })} className="btn-primary w-full">
          다음 단계로 이동하기
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}

// 10. 완료 화면
export function BuildDone() {
  const nav = useNavigate();
  return (
    <div className="flex min-h-full flex-col items-center bg-gradient-to-b from-lavender via-canvas to-canvas px-6 pb-8 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="relative mt-8 flex h-[250px] w-full items-center justify-center">
        <Icon name="heart" size={16} fill="#F08BB0" className="drift absolute left-[12%] top-[50%] text-[#F08BB0]" />
        <Icon name="heart" size={12} fill="#A78BFA" className="drift absolute right-[18%] top-[30%] text-[#A78BFA]" style={{ animationDelay: '0.7s' }} />
        <Icon name="heart" size={18} fill="#F08BB0" className="drift absolute right-[8%] top-[60%] text-[#F08BB0]" style={{ animationDelay: '1.3s' }} />
        <Character expr="heart" size={220} float className="pop" />
      </div>
      <h1 className="rise mt-4 text-title text-ink" style={{ animationDelay: '200ms' }}>
        프로필이 저장됐어! 💜
      </h1>
      <p className="rise mt-3 whitespace-pre-line text-center text-[0.875rem] leading-relaxed text-muted" style={{ animationDelay: '350ms' }}>
        {'앞으로도 새로운 경험이 생기면\n언제든 루다에게 찾아와서\n추가해줘.\n지금까지 정말 잘 해왔어! ✨'}
      </p>
      <div className="flex-1" />
      <button type="button" onClick={() => nav('/profile', { viewTransition: true })} className="btn-primary rise w-full" style={{ animationDelay: '500ms' }}>
        확인
        <Icon name="arrow" size={18} />
      </button>
      <button type="button" onClick={() => nav('/', { viewTransition: true })} className="btn-secondary rise mt-3 w-full" style={{ animationDelay: '600ms' }}>
        대시보드로 이동하기
      </button>
    </div>
  );
}
