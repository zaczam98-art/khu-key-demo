import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon, type IconName } from '../../components/Icon';
import { InstallBanner } from '../../components/InstallBanner';
import { db, type Profile } from '../../lib/db';
import { greetingByHour } from '../../lib/greeting';
import { useAppStore } from '../../store';

// 홈. 앱을 열면 쿠키가 먼저 말합니다. 일정·D-day·알림은 4단계에서 만듭니다.
export function Home() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const mode = useAppStore((s) => s.mode);
  const credits = useAppStore((s) => s.credits);

  useEffect(() => {
    db.profile.get('me').then((p) => setProfile(p ?? null));
  }, []);

  const jobs = profile?.targetJobs ?? [];
  const greeting = `${greetingByHour(new Date().getHours())}\n${
    jobs.length
      ? `저번에 ${jobs
          .slice(0, 2)
          .map((j) => j.name)
          .join(', ')} 쪽에 관심 있다고 했지?\n이제 경험 카드를 같이 정리해 보자.`
      : '아직 직무를 못 정했어도 괜찮아.\n나랑 가볍게 이야기하면서 찾아보자!'
  }`;
  const cards: { to: string; icon: IconName; title: string; desc: string; ready: boolean }[] = [
    { to: '/explore', icon: 'compass', title: '직무 탐색', desc: jobs.length ? `관심 직무 ${jobs.length}개 저장됨` : '쿠키와 대화로 찾기', ready: true },
    { to: '/profile', icon: 'user', title: '프로필', desc: jobs.length ? '탐색 결과 보기' : '아직 비어 있어요', ready: true },
    { to: '/essay', icon: 'doc', title: '자소서', desc: '3단계에서 열려요', ready: false },
    { to: '/mock', icon: 'mic', title: '면접', desc: '5단계에서 열려요', ready: false },
  ];
  const status = mode === 'live' ? `ChatKHU 연결됨 · 누적 크레딧 ${credits.toFixed(1)}` : mode === 'demo' ? '체험 모드 · 저장된 대화로 재생 중' : '체험 모드';

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-ink">홈</h1>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-muted shadow-card">{status}</span>
      </div>
      <div className="rise mt-4 flex items-start gap-3">
        <Character expr="smile" size={64} float className="shrink-0 rounded-full bg-lavender" />
        {profile === undefined ? <div className="skeleton h-20 w-56 rounded-bubble rounded-tl-md" /> : <div className="bubble-bot pop">{greeting}</div>}
      </div>
      <Link to="/explore" className="btn-primary rise mt-5" style={{ animationDelay: '120ms' }}>
        {jobs.length ? '직무 탐색 다시 하기' : '직무 탐색 시작하기'}
        <Icon name="arrow" size={18} />
      </Link>
      <InstallBanner />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <Link
            key={c.to}
            to={c.to}
            className={`card rise press flex flex-col gap-2 !p-4 ${c.ready ? '' : 'opacity-60'}`}
            style={{ animationDelay: `${200 + i * 70}ms` }}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.ready ? 'bg-lavender text-primary' : 'bg-canvas text-muted'}`}>
              <Icon name={c.icon} size={20} />
            </span>
            <span className="text-[15px] font-semibold text-ink">{c.title}</span>
            <span className="text-[12px] leading-snug text-muted">{c.desc}</span>
          </Link>
        ))}
      </div>
      <section className="card rise mt-3" style={{ animationDelay: '500ms' }}>
        <h2 className="text-[15px] font-semibold text-ink">오늘의 일정</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">지원 일정과 D-day, 알림은 4단계에서 만들어요.</p>
      </section>
    </div>
  );
}
