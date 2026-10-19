import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Character } from '../../components/Character';
import { db, type Profile } from '../../lib/db';
import { useAppStore } from '../../store';

// 홈. 일정과 알림은 4단계에서 만듭니다. 앱을 열면 쿠키가 먼저 말합니다.
export function Home() {
  const [profile, setProfile] = useState<Profile | undefined>();
  const mode = useAppStore((s) => s.mode);
  const credits = useAppStore((s) => s.credits);

  useEffect(() => {
    db.profile.get('me').then(setProfile);
  }, []);

  const jobs = profile?.targetJobs.map((j) => j.name) ?? [];
  const greeting = jobs.length
    ? `다시 왔구나! 저번에 ${jobs.slice(0, 2).join(', ')} 쪽에 관심 있다고 했지?\n이제 경험 카드를 같이 정리해 보자.`
    : '안녕! 나는 쿠키야 👋\n아직 직무를 못 정했어도 괜찮아.\n나랑 가볍게 이야기하면서 찾아보자!';
  const status = mode === 'live' ? `ChatKHU 연결됨 · 누적 크레딧 ${credits.toFixed(1)}` : mode === 'demo' ? '체험 모드 · 저장된 대화로 재생 중' : '체험 모드';

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
      <h1 className="text-[20px] font-bold text-ink">홈</h1>
      <div className="mt-4 flex items-start gap-3">
        <Character expr="smile" size={64} className="shrink-0 rounded-full bg-lavender" />
        <div className="bubble-bot">{greeting}</div>
      </div>
      <Link to="/explore" className="btn-primary mt-6">
        {jobs.length ? '직무 탐색 다시 하기 →' : '직무 탐색 시작하기 →'}
      </Link>
      <section className="card mt-6">
        <h2 className="text-[15px] font-semibold text-ink">오늘의 일정</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">지원 일정과 D-day, 알림은 4단계에서 만들어요.</p>
      </section>
      <p className="mt-auto pt-6 text-center text-[11px] text-muted">{status}</p>
    </div>
  );
}
