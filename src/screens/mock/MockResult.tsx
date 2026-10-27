import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState } from '../../components/ui';
import { RUBRIC } from '../../data/rubric';
import { scoreInterview, toMsgs } from '../../lib/api';
import { db, type MockSession as Session } from '../../lib/db';
import { formatDate } from '../../lib/dday';
import { nowIso, uid } from '../../lib/ids';
import { useAppStore } from '../../store';
import { readMockSetup } from './MockSetup';

// 면접 8. 면접 종료 및 결과 요약. /mock/result 는 방금 끝난 대화를 채점해 저장하고 /mock/:id 로 바꿉니다.
export const avgScore = (s: Session['scores']) => Math.round((s.logic + s.jobFit + s.concreteness + s.delivery) / 4);
const DOT = ['bg-success', 'bg-info', 'bg-warn', 'bg-primary'];

export function MockResult() {
  const nav = useNavigate();
  const { id } = useParams();
  const note = useAppStore((s) => s.note);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(null);
    (async () => {
      if (id) {
        const saved = await db.mockSessions.get(id);
        if (alive) setSession(saved ?? null);
        return;
      }
      const log = await db.chatLogs.get('log:mock');
      const turns = log?.turns ?? [];
      if (!turns.some((t) => t.role === 'user')) {
        if (alive) setSession(null);
        return;
      }
      const setup = readMockSetup();
      try {
        const r = await scoreInterview(toMsgs(turns), setup.type, setup.job, setup.company);
        if (!alive) return;
        note(r.demo, r.credits);
        const pairs: Session['turns'] = [];
        let pendingQ = '';
        for (const t of turns) {
          if (t.role === 'assistant') pendingQ = t.content;
          else pairs.push({ n: pairs.length + 1, kind: pendingQ.includes('-') ? '꼬리' : '기본', q: pendingQ, basis: '', a: t.content });
        }
        const created: Session = {
          id: uid(),
          appId: setup.appId,
          company: setup.company,
          job: setup.job,
          mode: 'voice',
          type: setup.type,
          focus: setup.focus,
          turns: pairs,
          scores: r.result.scores,
          evidence: r.result.evidence,
          summary: r.result.summary,
          details: r.result.perQuestion,
          createdAt: nowIso(),
        };
        await db.mockSessions.add(created);
        await db.chatLogs.delete('log:mock');
        setSession(created);
        nav(`/mock/${created.id}`, { replace: true });
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, attempt, nav, note]);

  if (error)
    return (
      <div className="flex min-h-full flex-col bg-canvas">
        <TitleHeader title="면접 결과" back="/mock" />
        <div className="px-4 pt-6 text-center">
          <p className="text-[0.875rem] text-warn">{error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-primary mt-3 w-full">
            <Icon name="refresh" size={18} />
            다시 시도
          </button>
        </div>
      </div>
    );
  if (session === undefined)
    return (
      <div className="flex min-h-full flex-col bg-canvas">
        <TitleHeader title="면접 결과" back="/mock" />
        <div className="flex flex-col items-center px-4 pt-10">
          <Character expr="laptop" size={120} float />
          <p className="mt-4 text-body text-ink">답변을 기준표에 맞춰 채점하는 중이야</p>
          <div className="mt-6 w-full space-y-3">
            {RUBRIC.map((r) => (
              <div key={r.key} className="skeleton h-8 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  if (session === null)
    return (
      <div className="p-4">
        <EmptyState expr="surprised" title="채점할 답변이 없어" desc="면접을 먼저 진행해 줘." action={{ label: '면접 시작', to: '/mock' }} />
      </div>
    );

  const total = avgScore(session.scores);
  const C = 2 * Math.PI * 44;
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="면접이 완료되었어요!" back="/mock" />
      <div className="flex-1 px-4 pb-8 pt-1">
        <div className="relative flex items-center justify-between">
          <div className="relative">
            <Icon name="sparkle" size={18} className="pop absolute -left-3 top-0 text-warn/70" style={{ animationDelay: '0.3s' }} />
            <Icon name="sparkle" size={14} className="pop absolute right-0 top-6 text-primary/60" style={{ animationDelay: '0.6s' }} />
            <Character expr="done" size={150} float className="pop" />
          </div>
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg width="112" height="112" viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
              <circle cx="56" cy="56" r="44" fill="none" className="stroke-lavender" strokeWidth="9" />
              <circle cx="56" cy="56" r="44" fill="none" className="stroke-primary transition-[stroke-dashoffset] duration-slow ease-app" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - total / 100)} />
            </svg>
            <span className="flex items-baseline gap-0.5">
              <span className="text-display tabular-nums text-ink">{total}</span>
              <span className="text-caption text-muted">/100</span>
            </span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-heading text-ink">
            {session.company ? `${session.company} ` : ''}
            {session.type} 면접
          </span>
          <Badge tone="line">{session.turns.length}문항</Badge>
          <span className="text-caption text-muted">{formatDate(session.createdAt)}</span>
        </div>

        <div className="card rise mt-4 grid grid-cols-2 gap-x-4 gap-y-3" style={{ animationDelay: '120ms' }}>
          {RUBRIC.map((r, i) => (
            <div key={r.key} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[i]}`} />
              <span className="flex-1 text-small text-ink">{r.label}</span>
              <span className="text-body font-semibold tabular-nums text-ink">{session.scores[r.key]}</span>
            </div>
          ))}
        </div>

        <section className="rise mt-5" style={{ animationDelay: '240ms' }}>
          <h2 className="section-title">전반적인 평가</h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">{session.summary}</p>
        </section>

        <div className="mt-6 flex gap-3">
          <Link to={`/mock/${session.id}/detail`} viewTransition className="btn-secondary flex-1">
            상세 피드백 보기
          </Link>
          <button type="button" onClick={() => nav('/mock/setup', { viewTransition: true })} className="btn-primary flex-1">
            다시 연습하기
          </button>
        </div>
      </div>
    </div>
  );
}
