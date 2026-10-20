import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { findJob } from '../../data/jobs';
import { db, type Profile } from '../../lib/db';

// 프로필. 경험 카드는 2단계에서 만듭니다. 지금은 탐색 결과만 보여 줍니다.
const BADGE = { 상: 'bg-primary text-white', 중: 'bg-lavender text-primary', 하: 'bg-canvas text-muted' } as const;

export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    db.profile.get('me').then((p) => setProfile(p ?? null));
  }, []);

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-ink">프로필</h1>
        {profile?.targetJobs.length ? <span className="rounded-full bg-lavender px-2.5 py-1 text-[11px] font-semibold text-primary">관심 직무 {profile.targetJobs.length}개</span> : null}
      </div>
      {profile === undefined && (
        <div className="card mt-4 space-y-3">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-4 w-full rounded-full" />
          <div className="skeleton h-4 w-3/4 rounded-full" />
        </div>
      )}
      {profile !== undefined && !profile?.targetJobs.length && (
        <div className="card rise mt-4 text-center">
          <p className="text-[14px] text-muted">아직 저장된 탐색 결과가 없어요.</p>
          <Link to="/explore" className="btn-primary mt-4">
            직무 탐색 시작하기
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      )}
      {profile?.targetJobs.length ? (
        <>
          <section className="card rise mt-4">
            <h2 className="text-[15px] font-semibold text-ink">관심 직무</h2>
            <ul className="mt-3 space-y-2">
              {profile.targetJobs.map((job, i) => {
                const entry = findJob(job.name);
                return (
                  <li key={job.name} className="rise" style={{ animationDelay: `${100 + i * 80}ms` }}>
                    <Link to={`/explore/dictionary/${encodeURIComponent(entry?.name ?? job.name)}`} className="press flex items-start gap-3 rounded-2xl p-2 transition-colors hover:bg-canvas">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">
                        <Icon name={entry?.icon ?? 'brand'} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] font-medium text-ink">{job.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] ${BADGE[job.confidence]}`}>적합도 {job.confidence}</span>
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-muted">{job.reason}</span>
                      </span>
                      <span className="mt-2 text-muted/60">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card rise mt-3" style={{ animationDelay: '300ms' }}>
            <h2 className="text-[15px] font-semibold text-ink">탐색 키워드</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.exploreKeywords.map((keyword, i) => (
                <span key={keyword} className="tag pop" style={{ animationDelay: `${350 + i * 60}ms` }}>
                  {keyword}
                </span>
              ))}
            </div>
          </section>
          <section className="card rise mt-3" style={{ animationDelay: '420ms' }}>
            <h2 className="text-[15px] font-semibold text-ink">강점</h2>
            <ul className="mt-2 space-y-1.5">
              {profile.strengths.map((strength) => (
                <li key={strength} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
                  {strength}
                </li>
              ))}
            </ul>
          </section>
          <Link to="/explore" className="press mt-5 inline-flex items-center justify-center gap-1 text-[13px] text-muted underline">
            <Icon name="refresh" size={14} />
            직무 탐색 다시 하기
          </Link>
        </>
      ) : null}
      <p className="mt-6 text-center text-[12px] text-muted">경험 카드는 2단계(프로필 구축)에서 만들어요.</p>
    </div>
  );
}
