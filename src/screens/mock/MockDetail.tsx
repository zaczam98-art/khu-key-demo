import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, ScoreBar } from '../../components/ui';
import { RUBRIC } from '../../data/rubric';
import { db } from '../../lib/db';
import { formatDate } from '../../lib/dday';
import { useAsync } from '../../lib/hooks';
import { avgScore } from './MockResult';

// 면접 9. 상세 피드백 및 개선 가이드 (탭: 종합 피드백 / 문항별 분석 / 모범 답안 예시)
const TABS = ['종합 피드백', '문항별 분석', '모범 답안 예시'] as const;

export function MockDetail() {
  const { id = '' } = useParams();
  const { data: session, loading } = useAsync(() => db.mockSessions.get(id), [id]);
  const [tab, setTab] = useState<(typeof TABS)[number]>('문항별 분석');
  const [open, setOpen] = useState<number | null>(null);

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (!session) return <div className="p-4"><EmptyState expr="think" title="기록을 찾을 수 없어" action={{ label: '면접으로', to: '/mock' }} /></div>;
  const details = session.details ?? [];

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="상세 피드백" back={`/mock/${session.id}`} />
      <div className="flex-1 px-4 pb-8 pt-1">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`chip press flex-1 justify-center px-2 ${tab === t ? 'chip-on' : ''}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === '종합 피드백' && (
          <>
            <div className="card rise mt-4 space-y-4">
              {RUBRIC.map((r, i) => (
                <ScoreBar key={r.key} label={r.label} value={session.scores[r.key]} delay={i * 80} />
              ))}
              <p className="text-right text-caption text-muted">
                평균 {avgScore(session.scores)}점 · {formatDate(session.createdAt)}
              </p>
            </div>
            {session.summary && (
              <div className="rise mt-4 flex items-start gap-3" style={{ animationDelay: '300ms' }}>
                <Character expr="smile" size={40} className="shrink-0 rounded-full bg-lavender" />
                <div className="bubble-bot">{session.summary}</div>
              </div>
            )}
            <ul className="mt-4 space-y-3">
              {session.evidence.map((e, i) => (
                <li key={i} className="card rise !p-4" style={{ animationDelay: `${360 + i * 80}ms` }}>
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
          </>
        )}

        {tab === '문항별 분석' && (
          <ul className="mt-4 space-y-3">
            {details.map((d, i) => (
              <li key={d.n} className="card rise !p-4" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-body font-semibold text-ink">
                    Q{d.n}. {d.title}
                  </h3>
                  <span className="shrink-0 text-body font-bold tabular-nums text-primary">
                    {d.score}
                    <span className="text-caption font-normal text-muted">/100</span>
                  </span>
                </div>
                {d.good.length > 0 && (
                  <section className="mt-3">
                    <p className="text-small font-semibold text-ink">좋았던 점</p>
                    <ul className="mt-1 space-y-1">
                      {d.good.map((g) => (
                        <li key={g} className="flex items-start gap-2 text-small text-ink">
                          <Icon name="check-circle" size={16} className="mt-0.5 shrink-0 text-success" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {d.improve.length > 0 && (
                  <section className="mt-3">
                    <p className="text-small font-semibold text-ink">개선하면 좋은 점</p>
                    <ul className="mt-1 space-y-1">
                      {d.improve.map((g) => (
                        <li key={g} className="flex items-start gap-2 text-small text-ink">
                          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {d.suggest.length > 0 && (
                  <div className="mt-3 rounded-tile bg-lavender px-3 py-2.5">
                    <p className="flex items-center gap-1 text-small font-semibold text-primary">
                      <Icon name="bulb" size={14} />
                      쿠키의 추천 답변 방향
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {d.suggest.map((s) => (
                        <li key={s} className="text-small text-ink">· {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.turns[i] && (
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} className="btn-ghost -ml-3 mt-1 min-h-[32px]">
                    <Icon name={open === i ? 'chevron-down' : 'chevron'} size={14} />
                    내 답변 {open === i ? '접기' : '보기'}
                  </button>
                )}
                {open === i && session.turns[i] && <p className="rounded-tile bg-canvas p-3 text-small text-ink">{session.turns[i].a}</p>}
              </li>
            ))}
            {details.length === 0 && <li className="text-small text-muted">문항별 분석이 없는 기록이에요.</li>}
          </ul>
        )}

        {tab === '모범 답안 예시' && (
          <ul className="mt-4 space-y-3">
            {details.map((d, i) => (
              <li key={d.n} className="card rise !p-4" style={{ animationDelay: `${i * 80}ms` }}>
                <p className="text-small font-semibold text-muted">
                  Q{d.n}. {d.title}
                </p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">{d.model || '모범 답안이 없어요.'}</p>
              </li>
            ))}
            <li className="text-caption text-muted">모범 답안은 지원자가 말한 사실만으로 다시 쓴 예시예요. 그대로 외우기보다 구조를 참고해 주세요.</li>
          </ul>
        )}

        <Link to="/mock/setup" viewTransition className="btn-primary mt-6 w-full">
          <Icon name="refresh" size={18} />
          다시 연습하기
        </Link>
      </div>
    </div>
  );
}
