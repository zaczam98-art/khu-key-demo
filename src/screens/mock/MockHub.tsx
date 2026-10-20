import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageTitle } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, SectionTitle, Sheet } from '../../components/ui';
import { INTERVIEW_TYPES, INTERVIEW_TYPE_DESC, RUBRIC } from '../../data/rubric';
import { db, type InterviewType } from '../../lib/db';
import { formatDate } from '../../lib/dday';
import { useAsync } from '../../lib/hooks';

// 면접 허브: 유형·지원 건 고르고 시작, 채점 기준표, 지난 세션
export const MOCK_SETUP_KEY = 'khu-mock-setup';
export type MockSetup = { type: InterviewType; appId?: string; company?: string; job?: string };

const avg = (s: { logic: number; jobFit: number; concreteness: number; delivery: number }) => Math.round((s.logic + s.jobFit + s.concreteness + s.delivery) / 4);

export function MockHub() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [type, setType] = useState<InterviewType>('실무');
  const [appId, setAppId] = useState<string>(params.get('app') ?? '');
  const [rubric, setRubric] = useState(false);
  const { data } = useAsync(async () => {
    const [apps, sessions, profile] = await Promise.all([db.applications.toArray(), db.mockSessions.orderBy('createdAt').reverse().toArray(), db.profile.get('me')]);
    return { apps, sessions, profile };
  }, []);
  const apps = data?.apps ?? [];
  const sessions = data?.sessions ?? [];

  const start = async () => {
    const app = apps.find((a) => a.id === appId);
    const setup: MockSetup = { type, appId: app?.id, company: app?.company, job: app?.job ?? data?.profile?.targetJobs[0]?.name };
    try {
      localStorage.setItem(MOCK_SETUP_KEY, JSON.stringify(setup));
    } catch {
      // 무시
    }
    await db.chatLogs.delete('log:mock');
    nav('/mock/session', { viewTransition: true });
  };

  return (
    <div className="flex min-h-full flex-col px-4 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <PageTitle
        title="모의 면접"
        right={
          <button type="button" onClick={() => setRubric(true)} className="btn-ghost -mr-3 text-primary">
            <Icon name="list" size={16} />
            채점 기준
          </button>
        }
      />
      <section className="mt-3">
        <SectionTitle>면접 유형</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {INTERVIEW_TYPES.map((t, i) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`card rise press flex flex-col gap-1 !p-4 text-left ${type === t ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-body font-semibold text-ink">{t} 면접</span>
              <span className="text-caption text-muted">{INTERVIEW_TYPE_DESC[t]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="card rise mt-4" style={{ animationDelay: '260ms' }}>
        <SectionTitle>어떤 지원 건으로?</SectionTitle>
        <select className="field" value={appId} onChange={(e) => setAppId(e.target.value)} aria-label="지원 건 선택">
          <option value="">지원 건 없이 (관심 직무 기준)</option>
          {apps.map((a) => (
            <option key={a.id} value={a.id}>
              {a.company} · {a.job}
            </option>
          ))}
        </select>
        <div className="mt-3 flex items-center gap-2 text-caption text-muted">
          <Icon name="mic-off" size={14} />
          음성 면접은 6단계에서 열려요. 지금은 글로 답해요.
        </div>
      </section>
      <button type="button" onClick={() => void start()} className="btn-primary rise mt-4 w-full" style={{ animationDelay: '320ms' }}>
        <Icon name="mic" size={18} />
        {type} 면접 시작
      </button>

      <section className="mt-6">
        <SectionTitle>지난 연습 {sessions.length ? <span className="text-muted">{sessions.length}</span> : null}</SectionTitle>
        {sessions.length === 0 ? (
          <EmptyState expr="suit" title="아직 연습 기록이 없어" desc="첫 면접을 끝내면 점수와 근거가 여기에 쌓여." />
        ) : (
          <ul className="space-y-2">
            {sessions.map((s, i) => (
              <li key={s.id}>
                <Link to={`/mock/${s.id}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="tile bg-lavender text-title text-primary">{avg(s.scores)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-body font-semibold text-ink">{s.type} 면접</span>
                      <Badge tone="line">{s.turns.length}문항</Badge>
                    </span>
                    <span className="block text-small text-muted">{formatDate(s.createdAt)}</span>
                  </span>
                  <Icon name="chevron" size={18} className="text-muted/60" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={rubric} onClose={() => setRubric(false)} title="채점 기준표">
        <p className="text-small text-muted">쿠키는 아래 기준으로 0~100점을 매기고, 답변 문장을 그대로 인용해 근거를 보여 줘.</p>
        <div className="mt-3 space-y-4">
          {RUBRIC.map((r) => (
            <div key={r.key}>
              <p className="text-body font-semibold text-ink">
                {r.label} <span className="text-small font-normal text-muted">{r.question}</span>
              </p>
              <ul className="mt-1 space-y-1">
                {r.levels.map((l) => (
                  <li key={l.score} className="flex gap-2 text-small text-ink">
                    <span className="w-9 shrink-0 font-semibold text-primary">{l.score}</span>
                    {l.desc}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
