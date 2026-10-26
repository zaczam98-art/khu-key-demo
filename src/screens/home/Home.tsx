import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Character } from '../../components/Character';
import { PageTitle } from '../../components/Header';
import { Icon, type IconName } from '../../components/Icon';
import { InstallBanner } from '../../components/InstallBanner';
import { Badge, SectionTitle } from '../../components/ui';
import { probeLive } from '../../lib/api';
import { ddayLabel, sortTasks } from '../../lib/dday';
import { db, type Task } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { buildNudge } from '../../lib/nudge';
import { useAppStore } from '../../store';

// 홈. 앱을 열면 루다가 먼저 말합니다. 선제 메시지와 일정은 코드 규칙으로 정합니다. (CLAUDE.md 9절)
export function Home() {
  const mode = useAppStore((s) => s.mode);
  const note = useAppStore((s) => s.note);
  // 아직 대화를 한 번도 안 했으면 서버에 연결 상태만 물어 배지를 맞춥니다. 대화 뒤에는 실제 응답의 demo 값이 우선합니다.
  useEffect(() => {
    if (mode !== null) return;
    let alive = true;
    void probeLive().then((live) => {
      if (alive && useAppStore.getState().mode === null) note(!live);
    });
    return () => {
      alive = false;
    };
  }, [mode, note]);
  const { data, loading, reload } = useAsync(async () => {
    const [profile, applications, experiences, tasks, sessions] = await Promise.all([
      db.profile.get('me'),
      db.applications.toArray(),
      db.experiences.toArray(),
      db.tasks.toArray(),
      db.mockSessions.toArray(),
    ]);
    return { profile: profile ?? null, applications, experiences, tasks, sessions };
  }, []);

  const nudge = data ? buildNudge(data) : null;
  const tasks = data ? sortTasks(data.tasks.filter((t) => !t.done)).slice(0, 3) : [];
  const toggle = async (t: Task) => {
    await db.tasks.put({ ...t, done: !t.done });
    reload();
  };
  const cards: { to: string; icon: IconName; title: string; desc: string }[] = [
    { to: '/explore', icon: 'compass', title: '직무 탐색', desc: data?.profile?.targetJobs.length ? `관심 직무 ${data.profile.targetJobs.length}개` : '루다와 대화로 찾기' },
    { to: '/profile', icon: 'user', title: '경험 카드', desc: data?.experiences.length ? `${data.experiences.length}개 정리됨` : '첫 카드 만들기' },
    { to: '/essay', icon: 'doc', title: '자소서', desc: data?.applications.length ? `지원 ${data.applications.length}건` : '지원 건 추가' },
    { to: '/mock', icon: 'mic', title: '모의 면접', desc: data?.sessions.length ? `${data.sessions.length}회 연습` : '첫 연습 시작' },
  ];

  return (
    <div className="flex min-h-full flex-col px-4 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <PageTitle title="홈" right={mode === null ? <span className="skeleton h-5 w-16 rounded-full" /> : <Badge tone={mode === 'live' ? 'success' : 'line'}>{mode === 'live' ? 'ChatKHU 연결됨' : '체험 모드'}</Badge>} />

      <div className="rise mt-3 flex items-start gap-3">
        <Character expr="smile" size={64} float className="shrink-0 rounded-full bg-lavender" />
        {loading || !nudge ? <div className="skeleton h-20 w-56 rounded-bubble rounded-tl-md" /> : <div className="bubble-bot pop">{nudge.text}</div>}
      </div>
      {nudge?.cta && (
        <Link to={nudge.cta.to} viewTransition className="btn-primary rise mt-4" style={{ animationDelay: '120ms' }}>
          {nudge.cta.label}
          <Icon name="arrow" size={18} />
        </Link>
      )}
      <InstallBanner />

      <section className="card rise mt-5" style={{ animationDelay: '200ms' }}>
        <SectionTitle
          right={
            <Link to="/schedule" viewTransition className="btn-ghost -mr-3 text-primary">
              전체 보기
              <Icon name="chevron" size={14} />
            </Link>
          }
        >
          다가오는 일정
        </SectionTitle>
        {tasks.length === 0 ? (
          <p className="text-small text-muted">아직 일정이 없어요. 지원 건을 추가하면 마감이 자동으로 들어와요.</p>
        ) : (
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => void toggle(t)} className="press flex min-h-[44px] w-full items-center gap-3 rounded-tile px-1 text-left">
                  <Icon name="circle" size={22} className="text-line" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem] text-ink">{t.title}</span>
                    <span className="text-caption text-muted">{t.type}</span>
                  </span>
                  <Badge tone={ddayLabel(t.dueAt) === 'D-DAY' || ddayLabel(t.dueAt).startsWith('D-') ? 'warn' : 'line'}>{ddayLabel(t.dueAt)}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <Link key={c.to} to={c.to} viewTransition className="card rise press flex flex-col gap-2 !p-4" style={{ animationDelay: `${280 + i * 70}ms` }}>
            <span className="tile h-9 w-9 bg-lavender text-primary">
              <Icon name={c.icon} size={20} />
            </span>
            <span className="text-body font-semibold text-ink">{c.title}</span>
            <span className="text-caption text-muted">{c.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
