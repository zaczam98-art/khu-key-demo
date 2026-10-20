import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { SettingsSheet } from '../../components/SettingsSheet';
import { Badge, EmptyState, SectionTitle } from '../../components/ui';
import { findJob } from '../../data/jobs';
import { db } from '../../lib/db';
import { periodLabel, topSkills } from '../../lib/experience';
import { useAsync } from '../../lib/hooks';

// 프로필 허브: 관심 직무(1단계), 경험 카드와 종합 분석(2단계)
const BADGE = { 상: 'solid', 중: 'soft', 하: 'line' } as const;

export function ProfileScreen() {
  const [settings, setSettings] = useState(false);
  const { data, loading } = useAsync(async () => {
    const [profile, experiences] = await Promise.all([db.profile.get('me'), db.experiences.orderBy('createdAt').reverse().toArray()]);
    return { profile: profile ?? null, experiences };
  }, []);
  const profile = data?.profile;
  const cards = data?.experiences ?? [];
  const skills = topSkills(cards);

  return (
    <div className="flex min-h-full flex-col px-4 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <PageTitle
        title={profile?.nickname ? `${profile.nickname}의 프로필` : '프로필'}
        right={
          <button type="button" aria-label="설정" onClick={() => setSettings(true)} className="press flex h-11 w-11 items-center justify-center rounded-full text-muted">
            <Icon name="settings" size={22} />
          </button>
        }
      />
      {loading && (
        <div className="card mt-4 space-y-3">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-4 w-full rounded-full" />
          <div className="skeleton h-4 w-3/4 rounded-full" />
        </div>
      )}

      {!loading && (
        <section className="mt-4">
          <SectionTitle
            right={
              <Link to="/profile/experience/new" viewTransition className="btn-ghost -mr-3 text-primary">
                <Icon name="plus" size={16} />
                카드 추가
              </Link>
            }
          >
            경험 카드 {cards.length ? <span className="text-muted">{cards.length}</span> : null}
          </SectionTitle>
          {cards.length === 0 ? (
            <EmptyState expr="wink" title="아직 경험 카드가 없어" desc={'쿠키와 10분만 이야기하면\n경험 하나가 카드로 정리돼.'} action={{ label: '첫 카드 만들기', to: '/profile/experience/new' }} />
          ) : (
            <ul className="space-y-2">
              {cards.map((c, i) => (
                <li key={c.id}>
                  <Link to={`/profile/experience/${c.id}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <Badge tone="soft">{c.category}</Badge>
                        <span className="text-caption text-muted">{periodLabel(c.period)}</span>
                      </span>
                      <span className="mt-1 block truncate text-body font-semibold text-ink">{c.title}</span>
                      <span className="mt-0.5 block truncate text-small text-muted">{c.role}</span>
                    </span>
                    <Icon name="chevron" size={18} className="text-muted/60" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && cards.length > 0 && (
        <section className="card rise mt-4" style={{ animationDelay: '200ms' }}>
          <SectionTitle>종합 분석</SectionTitle>
          <p className="text-small text-muted">카드 {cards.length}개에서 자주 드러난 역량이야.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={s.skill} className="pop inline-flex items-center gap-1 rounded-full bg-lavender px-3 py-1.5 text-small text-primary" style={{ animationDelay: `${250 + i * 60}ms` }}>
                {s.skill}
                {s.count > 1 && <span className="text-caption text-primary/70">×{s.count}</span>}
              </span>
            ))}
          </div>
          {profile?.strengths.length ? (
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
              {profile.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-small text-ink">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {!loading && (
        <section className="mt-4">
          <SectionTitle
            right={
              <Link to="/explore" viewTransition className="btn-ghost -mr-3 text-primary">
                <Icon name="refresh" size={14} />
                다시 탐색
              </Link>
            }
          >
            관심 직무
          </SectionTitle>
          {!profile?.targetJobs.length ? (
            <EmptyState expr="think" title="아직 저장된 직무가 없어" desc="직무 탐색을 하면 여기에 정리돼." action={{ label: '직무 탐색 시작하기', to: '/explore' }} />
          ) : (
            <ul className="card space-y-1 !p-2">
              {profile.targetJobs.map((job, i) => {
                const entry = findJob(job.name);
                return (
                  <li key={job.name} className="rise" style={{ animationDelay: `${100 + i * 70}ms` }}>
                    <Link to={`/explore/dictionary/${encodeURIComponent(entry?.name ?? job.name)}`} viewTransition className="press flex items-start gap-3 rounded-tile p-2 transition-colors duration-fast hover:bg-canvas">
                      <span className="tile h-10 w-10 bg-lavender text-primary">
                        <Icon name={entry?.icon ?? 'brand'} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-body font-medium text-ink">{job.name}</span>
                          <Badge tone={BADGE[job.confidence]}>적합도 {job.confidence}</Badge>
                        </span>
                        <span className="mt-0.5 block text-small text-muted">{job.reason}</span>
                      </span>
                      <Icon name="chevron" size={18} className="mt-2 text-muted/60" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {profile?.exploreKeywords.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.exploreKeywords.map((k) => (
                <span key={k} className="tag">
                  {k}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      )}
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
