import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, Sheet, Spinner } from '../../components/ui';
import { draftEssay } from '../../lib/api';
import { db, type Application, type EssayQuestion as Q, type Experience } from '../../lib/db';
import { missingKeywords, questionTitle, rankExperiences, splitByKeywords } from '../../lib/essay';
import { cardSummary, periodLabel } from '../../lib/experience';
import { useAsync } from '../../lib/hooks';
import { nowIso } from '../../lib/ids';
import { mask } from '../../lib/mask';
import { useAppStore } from '../../store';

// 자소서 3~8. 경험 매칭 → 경험 보완 → 초안(탭) → 첨삭(탭) → 완료
type Step = 'pick' | 'draft' | 'review';
const PICK_TABS = ['추천 경험', '추가 탐색', '새로 찾기'] as const;
const DRAFT_TABS = ['AI 초안', '키워드 강조', '다른 버전'] as const;
const REVIEW_TABS = ['전체 피드백', '문장 개선', '표현 제안'] as const;

export function EssayQuestionScreen() {
  const nav = useNavigate();
  const { id = '', qid = '' } = useParams();
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const { data, loading, reload } = useAsync(async () => {
    const [app, cards, profile] = await Promise.all([db.applications.get(id), db.experiences.orderBy('createdAt').reverse().toArray(), db.profile.get('me')]);
    return { app, cards, nickname: profile?.nickname };
  }, [id]);
  const app = data?.app;
  const cards: Experience[] = data?.cards ?? [];
  const q = app?.questions.find((x) => x.qid === qid);
  const qIndex = app ? app.questions.findIndex((x) => x.qid === qid) + 1 : 0;

  const [step, setStep] = useState<Step>('pick');
  const [pickTab, setPickTab] = useState<(typeof PICK_TABS)[number]>('추천 경험');
  const [draftTab, setDraftTab] = useState<(typeof DRAFT_TABS)[number]>('AI 초안');
  const [reviewTab, setReviewTab] = useState<(typeof REVIEW_TABS)[number]>('전체 피드백');
  const [expIds, setExpIds] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [verIndex, setVerIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState<'draft' | 'feedback' | 'revise' | null>(null);
  const [detail, setDetail] = useState<Experience | null>(null); // 경험 보완 시트
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (!q) return;
    setExpIds(q.expIds);
    const last = q.versions[q.versions.length - 1];
    setBody(last?.body ?? '');
    setVerIndex(q.versions.length ? q.versions.length - 1 : null);
    setStep(q.versions.length ? (q.points?.length ? 'review' : 'draft') : 'pick');
  }, [q?.qid]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveQuestion = async (patch: Partial<Q>) => {
    if (!app || !q) return;
    const questions = app.questions.map((x) => (x.qid === q.qid ? { ...x, ...patch } : x));
    const allDone = questions.every((x) => x.status === '완료');
    const next: Application = { ...app, questions, stage: app.stage === '관심' ? '작성중' : app.stage, completedAt: allDone ? (app.completedAt ?? nowIso()) : app.completedAt };
    await db.applications.put(next);
    reload();
  };
  const addVersion = async (text: string, model: string, extra: Partial<Q> = {}) => {
    if (!q) return;
    const version = { ver: q.versions.length + 1, body: text, model, createdAt: nowIso() };
    await saveQuestion({ versions: [...q.versions, version], status: q.status === '완료' ? '완료' : '작성중', ...extra });
    setVerIndex(q.versions.length);
  };
  const base = () => (app && q ? { company: app.company, job: app.job, keywords: app.keywords, values: app.values, question: q.text, limit: q.limit, experiences: cards.filter((c) => expIds.includes(c.id)).map(cardSummary) } : null);

  const toggleExp = (eid: string) => {
    const next = expIds.includes(eid) ? expIds.filter((x) => x !== eid) : [...expIds, eid];
    setExpIds(next);
    void saveQuestion({ expIds: next });
  };
  const makeDraft = async () => {
    const b = base();
    if (!b) return;
    if (!expIds.length) {
      showToast('경험 카드를 하나 이상 골라 줘');
      return;
    }
    setBusy('draft');
    try {
      const r = await draftEssay({ mode: 'draft', ...b });
      note(r.demo, r.credits);
      setBody(r.result.body);
      await addVersion(r.result.body, r.demo ? 'demo' : 'claude-sonnet-5-5', { feedback: r.result.feedback, points: r.result.points, examples: r.result.examples });
      setStep('draft');
      setDraftTab('AI 초안');
      showToast('초안을 만들었어요');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const getFeedback = async () => {
    const b = base();
    if (!b || !body.trim()) return;
    setBusy('feedback');
    try {
      const r = await draftEssay({ mode: 'feedback', ...b, body: mask(body) });
      note(r.demo, r.credits);
      await saveQuestion({ feedback: r.result.feedback, points: r.result.points, examples: r.result.examples });
      setStep('review');
      setReviewTab('전체 피드백');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const revise = async () => {
    const b = base();
    if (!b || !q) return;
    setBusy('revise');
    try {
      const r = await draftEssay({ mode: 'revise', ...b, body: mask(body), points: q.points });
      note(r.demo, r.credits);
      setBody(r.result.body);
      await addVersion(r.result.body, r.demo ? 'demo' : 'claude-sonnet-5-5', { feedback: r.result.feedback, points: r.result.points, examples: [] });
      setStep('draft');
      setDraftTab('AI 초안');
      showToast('전체 문장을 다듬었어요');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const saveMine = async () => {
    if (!body.trim()) return;
    await addVersion(body, 'me');
    showToast('내 수정본을 저장했어요');
  };
  const markDone = async () => {
    if (!q) return;
    await saveQuestion({ status: '완료' });
    showToast('문항 완료!');
    nav(`/essay/${id}`, { viewTransition: true });
  };
  // 경험 보완: 추가 질문에 답하면 카드의 주요 활동에 덧붙이고 "더 물을 것" 첫 항목을 지웁니다.
  const enrich = async () => {
    if (!detail || !answer.trim()) return;
    const next: Experience = { ...detail, activities: [...detail.activities, mask(answer.trim())], missing: detail.missing.slice(1) };
    await db.experiences.put(next);
    setDetail(next);
    setAnswer('');
    reload();
    showToast('카드에 덧붙였어요');
  };

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (!app || !q) return <div className="p-4"><EmptyState expr="surprised" title="문항을 찾을 수 없어" action={{ label: '자소서로', to: '/essay' }} /></div>;

  const ranked = rankExperiences(cards, app, q);
  const recommended = ranked.slice(0, 3).map((r) => r.card);
  const others = ranked.slice(3).map((r) => r.card);
  const over = body.length > q.limit;
  const title = `Q${qIndex}. ${questionTitle(q.text)}`;
  const points = q.points ?? [];
  const examples = q.examples ?? [];
  const missing = missingKeywords(body, app.keywords);

  const ExpCard = ({ c }: { c: Experience }) => {
    const on = expIds.includes(c.id);
    return (
      <li className={`card rise flex items-start gap-3 !p-4 transition-shadow duration-fast ${on ? 'ring-2 ring-primary' : ''}`}>
        <button type="button" aria-pressed={on} aria-label={`${c.title} 선택`} onClick={() => toggleExp(c.id)} className="press mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
          <Icon name={on ? 'check-circle' : 'circle'} size={22} className={on ? 'text-primary' : 'text-line'} fill={on ? 'rgb(var(--c-primary))' : 'none'} />
        </button>
        <button type="button" onClick={() => setDetail(c)} className="min-w-0 flex-1 text-left">
          <span className="block text-body font-semibold text-ink">{c.title}</span>
          <span className="mt-0.5 block text-small text-muted">{c.role || c.activities[0]}</span>
          <span className="mt-2 flex flex-wrap gap-1">
            {c.skills.slice(0, 3).map((s) => (
              <span key={s} className="tag">
                #{s.replace(/\s/g, '')}
              </span>
            ))}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title={`${title} (${q.limit}자)`} back={`/essay/${app.id}`} right={<Badge tone={q.status === '완료' ? 'success' : 'soft'}>{q.status}</Badge>} />
      <div className="flex-1 px-4 pb-28 pt-1">
        {/* ---------- 3·6. 경험 매칭 ---------- */}
        {step === 'pick' && (
          <>
            <div className="rise flex items-start gap-3">
              <Character expr="idea" size={44} className="shrink-0 rounded-full bg-lavender" />
              <div className="bubble-bot">{`이 기업의 자소서 문항을 분석해봤어!\n${data?.nickname ?? '너'}의 프로필에서 활용할 수 있는\n경험들을 먼저 추천해줄게.\n어떤 경험을 쓸지 같이 골라볼까? 💡`}</div>
            </div>
            <p className="mt-4 text-small text-muted">{q.text}</p>
            <div className="mt-3 flex gap-2">
              {PICK_TABS.map((t) => (
                <button key={t} type="button" aria-pressed={pickTab === t} onClick={() => (t === '새로 찾기' ? nav('/profile/build/categories', { viewTransition: true }) : setPickTab(t))} className={`chip press flex-1 justify-center ${pickTab === t ? 'chip-on' : ''}`}>
                  {t}
                  {t === '추천 경험' && ` (${recommended.length})`}
                  {t === '추가 탐색' && ` (${others.length})`}
                </button>
              ))}
            </div>
            {cards.length === 0 ? (
              <div className="mt-4">
                <EmptyState expr="write" title="경험 카드가 없어" desc="카드가 있어야 초안을 쓸 수 있어." action={{ label: '프로필 구축하기', to: '/profile/build' }} />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {(pickTab === '추천 경험' ? recommended : others).map((c) => (
                  <ExpCard key={c.id} c={c} />
                ))}
                {pickTab === '추가 탐색' && others.length === 0 && <li className="text-small text-muted">추천 경험 외에 더 없어요. "새로 찾기"로 카드를 추가할 수 있어.</li>}
              </ul>
            )}
          </>
        )}

        {/* ---------- 7. 초안 ---------- */}
        {step === 'draft' && (
          <>
            <div className="flex gap-2">
              {DRAFT_TABS.map((t) => (
                <button key={t} type="button" aria-pressed={draftTab === t} onClick={() => setDraftTab(t)} className={`chip press flex-1 justify-center ${draftTab === t ? 'chip-on' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
            {draftTab === 'AI 초안' && (
              <div className="rise mt-3">
                <textarea className={`field min-h-[320px] leading-relaxed ${over ? 'border-danger ring-2 ring-danger/30' : ''}`} value={body} onChange={(e) => setBody(e.target.value)} aria-label="자소서 본문" />
                <div className="mt-1 flex items-center justify-between text-caption">
                  <span className={over ? 'font-semibold text-danger' : 'text-muted'}>
                    {body.length} / {q.limit}자{over ? ` · ${body.length - q.limit}자 초과` : ''}
                  </span>
                  <button type="button" onClick={() => void saveMine()} disabled={!body.trim()} className="btn-ghost -mr-3 min-h-[36px] text-primary">
                    <Icon name="check" size={14} />내 수정본 저장
                  </button>
                </div>
              </div>
            )}
            {draftTab === '키워드 강조' && (
              <div className="card rise mt-3">
                <p className="whitespace-pre-line text-[0.875rem] leading-relaxed text-ink">
                  {splitByKeywords(body, app.keywords).map((p, i) => (p.hit ? <mark key={i} className="rounded bg-primary/20 px-0.5 text-ink">{p.text}</mark> : <span key={i}>{p.text}</span>))}
                </p>
                <p className="mt-3 text-caption text-muted">{missing.length ? `아직 안 쓴 키워드: ${missing.join(', ')}` : '공고 키워드가 모두 들어 있어요.'}</p>
              </div>
            )}
            {draftTab === '다른 버전' && (
              <ul className="mt-3 space-y-2">
                {q.versions.map((v, i) => (
                  <li key={v.ver}>
                    <button
                      type="button"
                      onClick={() => {
                        setVerIndex(i);
                        setBody(v.body);
                        setDraftTab('AI 초안');
                      }}
                      className={`card rise press w-full text-left !p-4 ${verIndex === i ? 'ring-2 ring-primary' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <Badge tone={v.model === 'me' ? 'line' : 'soft'}>v{v.ver}</Badge>
                        <span className="text-small text-muted">{v.model === 'me' ? '내 수정' : v.model === 'demo' ? '체험' : '루다'} · {v.body.length}자</span>
                      </span>
                      <span className="mt-2 line-clamp-2 block text-[0.875rem] text-ink">{v.body}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ---------- 8. 첨삭 ---------- */}
        {step === 'review' && (
          <>
            <div className="flex gap-2">
              {REVIEW_TABS.map((t) => (
                <button key={t} type="button" aria-pressed={reviewTab === t} onClick={() => setReviewTab(t)} className={`chip press flex-1 justify-center ${reviewTab === t ? 'chip-on' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
            {reviewTab === '전체 피드백' && (
              <section className="card rise mt-3">
                <h2 className="flex items-center gap-1.5 text-body font-semibold text-ink">
                  <Icon name="bulb" size={16} className="text-warn" />
                  루다의 피드백
                </h2>
                <ul className="mt-3 space-y-2">
                  {(points.length ? points : [q.feedback ?? '아직 피드백이 없어요.']).map((p, i) => (
                    <li key={i} className="rise flex items-start gap-2 text-[0.875rem] leading-relaxed text-ink" style={{ animationDelay: `${i * 80}ms` }}>
                      <Icon name="check-circle" size={16} className="mt-0.5 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
                {examples[0] && (
                  <div className="mt-4">
                    <h3 className="text-small font-semibold text-muted">개선 제안 예시</h3>
                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div className="rounded-tile bg-canvas p-3 text-caption text-muted">
                        <span className="mb-1 block font-semibold">Before</span>
                        {examples[0].before}
                      </div>
                      <Icon name="arrow" size={16} className="text-primary" />
                      <div className="rounded-tile bg-lavender p-3 text-caption text-ink">
                        <span className="mb-1 block font-semibold text-primary">After</span>
                        {examples[0].after}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
            {reviewTab === '문장 개선' && (
              <ul className="mt-3 space-y-3">
                {examples.map((ex, i) => (
                  <li key={i} className="card rise !p-4" style={{ animationDelay: `${i * 80}ms` }}>
                    <p className="text-caption font-semibold text-muted">Before</p>
                    <p className="mt-1 text-[0.875rem] text-muted line-through decoration-danger/50">{ex.before}</p>
                    <p className="mt-3 text-caption font-semibold text-primary">After</p>
                    <p className="mt-1 text-[0.875rem] text-ink">{ex.after}</p>
                  </li>
                ))}
                {examples.length === 0 && <li className="text-small text-muted">문장 단위 제안이 없어요. 전체 피드백을 참고해 줘.</li>}
              </ul>
            )}
            {reviewTab === '표현 제안' && (
              <section className="card rise mt-3">
                <h3 className="text-body font-semibold text-ink">아직 안 쓴 공고 키워드</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {missing.length ? missing.map((k) => <span key={k} className="tag">{k}</span>) : <span className="text-small text-muted">공고 키워드가 모두 들어 있어요.</span>}
                </div>
                {app.values && <p className="mt-4 text-small text-muted">인재상 "{app.values}"과 이어지는 문장이 있는지 확인해 줘.</p>}
                {q.feedback && (
                  <div className="mt-4 flex items-start gap-2">
                    <Character expr="smile" size={36} className="shrink-0 rounded-full bg-lavender" />
                    <div className="bubble-bot">{q.feedback}</div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* ---------- 하단 버튼 ---------- */}
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {step === 'pick' && (
          <button type="button" onClick={() => void makeDraft()} disabled={busy !== null || cards.length === 0} className="btn-primary w-full">
            {busy === 'draft' ? <Spinner /> : <Icon name="wand" size={18} />}
            {expIds.length ? `경험 ${expIds.length}개로 초안 만들기` : '경험을 고르고 초안 만들기'}
          </button>
        )}
        {step === 'draft' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('pick')} className="btn-secondary px-4">
              다시 작성하기
            </button>
            <button type="button" onClick={() => void getFeedback()} disabled={busy !== null || !body.trim()} className="btn-primary flex-1">
              {busy === 'feedback' ? <Spinner /> : null}
              이 내용으로 계속하기
              <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
        {step === 'review' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => void markDone()} className="btn-secondary px-4">
              <Icon name="check-circle" size={16} />
              완료
            </button>
            <button type="button" onClick={() => void revise()} disabled={busy !== null} className="btn-primary flex-1">
              {busy === 'revise' ? <Spinner /> : <Icon name="wand" size={18} />}
              이런 식으로 전체 문장 수정하기
            </button>
          </div>
        )}
      </div>

      {/* ---------- 4·5. 경험 세부 내용 확인 및 보완 ---------- */}
      <Sheet open={!!detail} onClose={() => setDetail(null)} title="경험 세부 내용">
        {detail && (
          <>
            <div className="flex items-start gap-3">
              <Character expr="explain" size={40} className="shrink-0 rounded-full bg-lavender" />
              <div className="bubble-bot !max-w-none">{'이 경험을 자소서에 사용하려면\n조금 더 구체적인 내용이 필요해!\n내가 기억한 내용은 이 정도야.\n맞는지 확인해줘, 부족한 부분은\n추가로 질문할게! 😊'}</div>
            </div>
            <div className="card mt-3 !p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-body font-semibold text-ink">{detail.title}</h3>
                <Link to={`/profile/experience/${detail.id}`} viewTransition className="text-small text-primary">
                  수정하기
                </Link>
              </div>
              <p className="mt-1 text-caption text-muted">내가 기억한 내용</p>
              <dl className="mt-2 space-y-1.5 text-small">
                <div className="flex gap-3"><dt className="w-14 shrink-0 text-muted">기간</dt><dd className="text-ink">{periodLabel(detail.period)}</dd></div>
                <div className="flex gap-3"><dt className="w-14 shrink-0 text-muted">역할</dt><dd className="text-ink">{detail.role || '-'}</dd></div>
                <div className="flex gap-3"><dt className="w-14 shrink-0 text-muted">주요 내용</dt><dd className="text-ink">{detail.activities.join(', ') || '-'}</dd></div>
                <div className="flex gap-3"><dt className="w-14 shrink-0 text-muted">성과</dt><dd className="text-ink">{detail.achievements.join(', ') || '-'}</dd></div>
              </dl>
            </div>
            <div className="mt-3 rounded-card bg-lavender px-4 py-3">
              <p className="flex items-center gap-1 text-small font-semibold text-primary">
                <Icon name="bulb" size={14} />
                루다의 추가 질문
              </p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-ink">{detail.missing[0] ?? '이 경험에서 가장 어려웠던 점은 무엇이었고, 어떻게 해결했는지 구체적으로 말해줄 수 있을까? 결과는 어땠는지도 궁금해!'}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <input className="field" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="답변을 입력해주세요..." onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && (e.preventDefault(), void enrich())} />
              <button type="button" onClick={() => void enrich()} disabled={!answer.trim()} className="btn-primary shrink-0 px-4">
                <Icon name="arrow-up" size={18} />
              </button>
            </div>
            {(detail.activities.length + detail.achievements.length) > 0 && (
              <div className="mt-3">
                <p className="text-small font-semibold text-ink">핵심 포인트 요약</p>
                <ul className="mt-1.5 space-y-1">
                  {[...detail.achievements, ...detail.activities].slice(0, 4).map((p) => (
                    <li key={p} className="flex items-start gap-2 text-small text-ink">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (!expIds.includes(detail.id)) toggleExp(detail.id);
                setDetail(null);
              }}
              className="btn-primary mt-4 w-full"
            >
              이 경험 쓰기
              <Icon name="check" size={18} />
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}
