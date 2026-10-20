import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, SectionTitle, Spinner, ToggleChip } from '../../components/ui';
import { draftEssay } from '../../lib/api';
import { db, type Application, type EssayQuestion as Q, type Experience } from '../../lib/db';
import { cardSummary } from '../../lib/experience';
import { useAsync } from '../../lib/hooks';
import { nowIso } from '../../lib/ids';
import { mask } from '../../lib/mask';
import { useAppStore } from '../../store';

// 문항 작업실: 경험 카드 고르기 → 초안 → 고치기 → 피드백 → 완료
export function EssayQuestionScreen() {
  const { id = '', qid = '' } = useParams();
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const { data, loading, reload } = useAsync(async () => {
    const [app, cards] = await Promise.all([db.applications.get(id), db.experiences.orderBy('createdAt').reverse().toArray()]);
    return { app, cards };
  }, [id]);
  const app = data?.app;
  const cards: Experience[] = data?.cards ?? [];
  const q = app?.questions.find((x) => x.qid === qid);

  const [expIds, setExpIds] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [feedback, setFeedback] = useState<string | undefined>();
  const [verIndex, setVerIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState<'draft' | 'feedback' | null>(null);

  useEffect(() => {
    if (!q) return;
    setExpIds(q.expIds);
    const last = q.versions[q.versions.length - 1];
    setBody(last?.body ?? '');
    setVerIndex(q.versions.length ? q.versions.length - 1 : null);
    setFeedback(q.feedback);
  }, [q?.qid]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveQuestion = async (patch: Partial<Q>) => {
    if (!app || !q) return;
    const next: Application = { ...app, questions: app.questions.map((x) => (x.qid === q.qid ? { ...x, ...patch } : x)), stage: app.stage === '관심' ? '작성중' : app.stage };
    await db.applications.put(next);
    reload();
  };
  const toggleExp = (eid: string) => {
    const next = expIds.includes(eid) ? expIds.filter((x) => x !== eid) : [...expIds, eid];
    setExpIds(next);
    void saveQuestion({ expIds: next });
  };
  const addVersion = async (text: string, model: string, fb?: string) => {
    if (!q) return;
    const version = { ver: q.versions.length + 1, body: text, model, createdAt: nowIso() };
    await saveQuestion({ versions: [...q.versions, version], feedback: fb ?? q.feedback, status: q.status === '완료' ? '완료' : '작성중' });
    setVerIndex(q.versions.length);
  };
  const common = () =>
    app && q
      ? { company: app.company, job: app.job, keywords: app.keywords, values: app.values, question: q.text, limit: q.limit, experiences: cards.filter((c) => expIds.includes(c.id)).map(cardSummary) }
      : null;
  const makeDraft = async () => {
    const base = common();
    if (!base) return;
    if (!expIds.length) {
      showToast('경험 카드를 하나 이상 골라 줘');
      return;
    }
    setBusy('draft');
    try {
      const r = await draftEssay({ mode: 'draft', ...base });
      note(r.demo, r.credits);
      setBody(r.result.body);
      setFeedback(r.result.feedback);
      await addVersion(r.result.body, r.demo ? 'demo' : 'claude-sonnet-5-5', r.result.feedback);
      showToast('초안을 만들었어요');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const getFeedback = async () => {
    const base = common();
    if (!base || !body.trim()) return;
    setBusy('feedback');
    try {
      const r = await draftEssay({ mode: 'feedback', ...base, body: mask(body) });
      note(r.demo, r.credits);
      setFeedback(r.result.feedback);
      await saveQuestion({ feedback: r.result.feedback });
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
    await saveQuestion({ status: q.status === '완료' ? '작성중' : '완료' });
    showToast(q.status === '완료' ? '작성 중으로 돌렸어요' : '문항 완료!');
  };

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (!app || !q) return <div className="p-4"><EmptyState expr="think" title="문항을 찾을 수 없어" action={{ label: '자소서로', to: '/essay' }} /></div>;
  const over = body.length > q.limit;
  const qIndex = app.questions.findIndex((x) => x.qid === q.qid) + 1;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title={`문항 ${qIndex}`} back={`/essay/${app.id}`} right={<Badge tone={q.status === '완료' ? 'success' : 'soft'}>{q.status}</Badge>} />
      <div className="flex-1 px-4 pb-10 pt-2">
        <p className="rise rounded-card bg-lavender px-4 py-3 text-[0.875rem] leading-relaxed text-ink">{q.text}</p>
        <p className="mt-1 text-right text-caption text-muted">
          {app.company} · {q.limit}자
        </p>

        <section className="mt-5">
          <SectionTitle>쓸 경험 카드</SectionTitle>
          {cards.length === 0 ? (
            <EmptyState expr="think" title="경험 카드가 없어" desc="카드가 있어야 초안을 쓸 수 있어." action={{ label: '카드 만들기', to: '/profile/experience/new' }} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {cards.map((c) => (
                <ToggleChip key={c.id} on={expIds.includes(c.id)} onClick={() => toggleExp(c.id)}>
                  {c.title}
                </ToggleChip>
              ))}
            </div>
          )}
        </section>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => void makeDraft()} disabled={busy !== null || cards.length === 0} className="btn-primary flex-1">
            {busy === 'draft' ? <Spinner /> : <Icon name="wand" size={18} />}
            {q.versions.length ? '초안 다시 만들기' : '초안 만들기'}
          </button>
          <button type="button" onClick={() => void getFeedback()} disabled={busy !== null || !body.trim()} className="btn-secondary flex-1">
            {busy === 'feedback' ? <Spinner /> : <Icon name="message" size={18} />}
            피드백 받기
          </button>
        </div>

        {q.versions.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {q.versions.map((v, i) => (
              <button
                key={v.ver}
                type="button"
                aria-pressed={verIndex === i}
                onClick={() => {
                  setVerIndex(i);
                  setBody(v.body);
                }}
                className={`chip press shrink-0 ${verIndex === i ? 'chip-on' : ''}`}
              >
                v{v.ver} · {v.model === 'me' ? '내 수정' : v.model === 'demo' ? '체험' : '쿠키'}
              </button>
            ))}
          </div>
        )}

        <section className="mt-4">
          <textarea
            className={`field min-h-[260px] leading-relaxed ${over ? 'border-danger ring-2 ring-danger/30' : ''}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="초안을 만들거나 직접 써 보세요."
            aria-label="자소서 본문"
          />
          <div className="mt-1 flex items-center justify-between text-caption">
            <span className={over ? 'font-semibold text-danger' : 'text-muted'}>
              {body.length} / {q.limit}자{over ? ` · ${body.length - q.limit}자 초과` : ''}
            </span>
            <button type="button" onClick={() => void saveMine()} disabled={!body.trim()} className="btn-ghost -mr-3 min-h-[36px] text-primary">
              <Icon name="check" size={14} />내 수정본 저장
            </button>
          </div>
        </section>

        {feedback && (
          <div className="rise mt-4 flex items-start gap-3">
            <Character expr="smile" size={44} className="shrink-0 rounded-full bg-lavender" />
            <div className="bubble-bot">{feedback}</div>
          </div>
        )}

        <button type="button" onClick={() => void markDone()} className={`mt-6 w-full ${q.status === '완료' ? 'btn-secondary' : 'btn-primary'}`}>
          <Icon name={q.status === '완료' ? 'refresh' : 'check-circle'} size={18} />
          {q.status === '완료' ? '다시 작성 중으로' : '이 문항 완료'}
        </button>
      </div>
    </div>
  );
}
