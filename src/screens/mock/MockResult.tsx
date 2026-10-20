import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, ScoreBar, SectionTitle } from '../../components/ui';
import { RUBRIC } from '../../data/rubric';
import { scoreInterview, toMsgs } from '../../lib/api';
import { db, type MockSession as Session } from '../../lib/db';
import { formatDate } from '../../lib/dday';
import { nowIso, uid } from '../../lib/ids';
import { useAppStore } from '../../store';
import { readMockSetup } from './MockSession';

// 면접 결과. /mock/result 는 방금 끝난 대화를 채점해 저장하고, /mock/:id 는 저장된 결과를 보여 줍니다.
const avg = (s: Session['scores']) => Math.round((s.logic + s.jobFit + s.concreteness + s.delivery) / 4);

export function MockResult() {
  const nav = useNavigate();
  const { id } = useParams();
  const note = useAppStore((s) => s.note);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

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
        const r = await scoreInterview(toMsgs(turns), setup.type, setup.job);
        if (!alive) return;
        note(r.demo, r.credits);
        // 질문-답변 쌍으로 묶습니다. 첫 질문은 기본, 그 뒤는 꼬리 질문입니다.
        const pairs: Session['turns'] = [];
        let pendingQ = '';
        for (const t of turns) {
          if (t.role === 'assistant') pendingQ = t.content;
          else pairs.push({ n: pairs.length + 1, kind: pairs.length === 0 ? '기본' : '꼬리', q: pendingQ, basis: '', a: t.content });
        }
        const created: Session = { id: uid(), appId: setup.appId, mode: 'text', type: setup.type, turns: pairs, scores: r.result.scores, evidence: r.result.evidence, summary: r.result.summary, createdAt: nowIso() };
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
          <Character expr="suit" size={120} float />
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
        <EmptyState expr="think" title="채점할 답변이 없어" desc="면접을 먼저 진행해 줘." action={{ label: '면접 시작', to: '/mock' }} />
      </div>
    );

  const total = avg(session.scores);
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="면접 결과" back="/mock" />
      <div className="flex-1 px-4 pb-8 pt-2">
        <div className="rise flex items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" className="stroke-lavender" strokeWidth="8" />
              <circle cx="48" cy="48" r="40" fill="none" className="stroke-primary transition-[stroke-dashoffset] duration-slow ease-app" strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - total / 100)} />
            </svg>
            <span className="text-display tabular-nums text-ink">{total}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-heading text-ink">{session.type} 면접</span>
              <Badge tone="line">{session.turns.length}문항</Badge>
            </div>
            <p className="mt-1 text-small text-muted">{formatDate(session.createdAt)}</p>
          </div>
        </div>

        <div className="card rise mt-5 space-y-4" style={{ animationDelay: '120ms' }}>
          {RUBRIC.map((r, i) => (
            <ScoreBar key={r.key} label={r.label} value={session.scores[r.key]} delay={200 + i * 90} />
          ))}
        </div>

        {session.summary && (
          <div className="rise mt-5 flex items-start gap-3" style={{ animationDelay: '500ms' }}>
            <Character expr="smile" size={44} className="shrink-0 rounded-full bg-lavender" />
            <div className="bubble-bot">{session.summary}</div>
          </div>
        )}

        <section className="mt-6">
          <SectionTitle>근거</SectionTitle>
          <ul className="space-y-3">
            {session.evidence.map((e, i) => (
              <li key={i} className="card rise !p-4" style={{ animationDelay: `${560 + i * 80}ms` }}>
                <Badge tone="soft">{e.item}</Badge>
                {e.quote && (
                  <p className="mt-2 flex gap-2 text-small text-muted">
                    <Icon name="quote" size={14} className="mt-0.5 shrink-0" />
                    <span className="italic">{e.quote}</span>
                  </p>
                )}
                <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">{e.comment}</p>
              </li>
            ))}
          </ul>
        </section>

        <button type="button" onClick={() => setShowTranscript((v) => !v)} className="btn-ghost mt-5 w-full">
          <Icon name={showTranscript ? 'chevron-down' : 'history'} size={16} />
          대화 {showTranscript ? '접기' : '다시 보기'}
        </button>
        {showTranscript && (
          <ol className="mt-2 space-y-3">
            {session.turns.map((t) => (
              <li key={t.n} className="card !p-4">
                <p className="flex items-center gap-2 text-caption text-muted">
                  <Badge tone="line">{t.kind}</Badge>Q{t.n}
                </p>
                <p className="mt-1 text-small text-ink">{t.q}</p>
                <p className="mt-2 rounded-tile bg-canvas p-3 text-small text-ink">{t.a}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-8 flex gap-3">
          <button type="button" onClick={() => nav('/', { viewTransition: true })} className="btn-secondary flex-1">
            홈으로
          </button>
          <button type="button" onClick={() => nav('/mock', { viewTransition: true })} className="btn-primary flex-1">
            <Icon name="refresh" size={18} />
            다시 연습하기
          </button>
        </div>
      </div>
    </div>
  );
}
