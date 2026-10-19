import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, type Profile } from '../../lib/db';

// 프로필. 경험 카드는 2단계에서 만듭니다. 지금은 탐색 결과만 보여 줍니다.
const BADGE = { 상: 'bg-primary text-white', 중: 'bg-lavender text-primary', 하: 'bg-canvas text-muted' } as const;

export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | undefined>();

  useEffect(() => {
    db.profile.get('me').then(setProfile);
  }, []);

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
      <h1 className="text-[20px] font-bold text-ink">프로필</h1>
      {!profile?.targetJobs.length ? (
        <div className="card mt-4 text-center">
          <p className="text-[14px] text-muted">아직 저장된 탐색 결과가 없어요.</p>
          <Link to="/explore" className="btn-primary mt-4">
            직무 탐색 시작하기 →
          </Link>
        </div>
      ) : (
        <>
          <section className="card mt-4">
            <h2 className="text-[15px] font-semibold text-ink">관심 직무</h2>
            <ul className="mt-3 space-y-3">
              {profile.targetJobs.map((job) => (
                <li key={job.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium text-ink">{job.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${BADGE[job.confidence]}`}>적합도 {job.confidence}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{job.reason}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="card mt-3">
            <h2 className="text-[15px] font-semibold text-ink">탐색 키워드</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.exploreKeywords.map((keyword) => (
                <span key={keyword} className="tag">
                  {keyword}
                </span>
              ))}
            </div>
          </section>
          <section className="card mt-3">
            <h2 className="text-[15px] font-semibold text-ink">강점</h2>
            <ul className="mt-2 space-y-1.5">
              {profile.strengths.map((strength) => (
                <li key={strength} className="text-[13px] leading-relaxed text-ink">
                  · {strength}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <p className="mt-6 text-center text-[12px] text-muted">경험 카드는 2단계(프로필 구축)에서 만들어요.</p>
    </div>
  );
}
