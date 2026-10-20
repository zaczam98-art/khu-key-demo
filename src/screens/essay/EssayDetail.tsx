import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, SectionTitle } from '../../components/ui';
import { ddayLabel, formatDate } from '../../lib/dday';
import { db, STAGES, type Application, type Stage } from '../../lib/db';
import { questionTitle } from '../../lib/essay';
import { useAsync } from '../../lib/hooks';
import { nowIso } from '../../lib/ids';
import { useAppStore } from '../../store';

// 자소서 9. 완성본 저장 및 지원 관리. 문항별/전체 보기, 지원 현황, 제출.
const STATUS = { 미작성: { tone: 'line', label: '미작성' }, 작성중: { tone: 'soft', label: '작성 중' }, 완료: { tone: 'success', label: '작성 완료' } } as const;
const short = (iso?: string) => (iso ? `${new Date(iso).getMonth() + 1}.${String(new Date(iso).getDate()).padStart(2, '0')}` : '');

export function EssayDetail() {
  const nav = useNavigate();
  const { id = '' } = useParams();
  const showToast = useAppStore((s) => s.showToast);
  const { data: app, loading, reload } = useAsync(() => db.applications.get(id), [id]);
  const [tab, setTab] = useState<'문항별 보기' | '전체 보기'>('문항별 보기');
  const [more, setMore] = useState(false);
  const [newItem, setNewItem] = useState('');

  const update = async (patch: Partial<Application>) => {
    if (!app) return;
    await db.applications.put({ ...app, ...patch });
    reload();
  };
  const remove = async () => {
    if (!app || !window.confirm(`${app.company} 지원 건을 지울까요? 문항 초안도 함께 지워져요.`)) return;
    await db.applications.delete(app.id);
    await db.tasks.where('appId').equals(app.id).delete();
    showToast('지원 건을 지웠어요');
    nav('/essay/list', { replace: true, viewTransition: true });
  };
  const submit = async () => {
    if (!app) return;
    const checklist = app.checklist.map((c) => (c.item === '제출 완료' || c.item === '자소서 전체 문항 완료' ? { ...c, done: true } : c));
    await update({ stage: app.stage === '관심' || app.stage === '작성중' ? '제출' : app.stage, submittedAt: nowIso(), completedAt: app.completedAt ?? nowIso(), checklist });
    await db.tasks.where('appId').equals(app.id).modify({ done: true });
    nav(`/essay/${app.id}/done`, { viewTransition: true });
  };
  const copyAll = async () => {
    if (!app) return;
    const text = app.questions.map((q, i) => `Q${i + 1}. ${q.text}\n${q.versions[q.versions.length - 1]?.body ?? '(미작성)'}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('전체 글을 복사했어요');
    } catch {
      showToast('복사할 수 없는 브라우저예요');
    }
  };

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (!app) return <div className="p-4"><EmptyState expr="think" title="지원 건을 찾을 수 없어" action={{ label: '자소서로', to: '/essay' }} /></div>;
  const allDone = app.questions.length > 0 && app.questions.every((q) => q.status === '완료');
  const stageIndex = STAGES.indexOf(app.stage);
  const submitted = stageIndex >= STAGES.indexOf('제출');

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader
        title={
          <span className="inline-flex items-center gap-2">
            {app.company} 자소서{allDone ? ' (최종본)' : ''}
            <Badge tone={allDone ? 'success' : 'soft'}>{allDone ? '저장 완료' : '작성 중'}</Badge>
          </span>
        }
        back="/essay/list"
        right={
          <button type="button" aria-label="지우기" onClick={() => void remove()} className="press flex h-11 w-11 items-center justify-center rounded-full text-muted">
            <Icon name="trash" size={20} />
          </button>
        }
      />
      <div className="flex-1 px-4 pb-8 pt-1">
        <div className="flex gap-2">
          {(['문항별 보기', '전체 보기'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`chip press flex-1 justify-center ${tab === t ? 'chip-on' : ''}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === '문항별 보기' ? (
          <ul className="mt-4 space-y-2">
            {app.questions.map((q, i) => (
              <li key={q.qid}>
                <Link to={`/essay/${app.id}/q/${q.qid}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${i * 70}ms` }}>
                  <Icon name={q.status === '완료' ? 'check-circle' : 'circle'} size={22} className={q.status === '완료' ? 'text-success' : 'text-line'} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold text-ink">
                      Q{i + 1}. {questionTitle(q.text)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-caption text-muted">
                      {q.limit}자 · {STATUS[q.status].label}
                      {q.versions.length > 0 && <Badge tone="line">v{q.versions.length}</Badge>}
                    </span>
                  </span>
                  <span className="text-small text-primary">수정하기</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card rise mt-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title">전체 보기</h2>
              <button type="button" onClick={() => void copyAll()} className="btn-ghost -mr-3 min-h-[36px] text-primary">
                <Icon name="copy" size={14} />
                복사
              </button>
            </div>
            {app.questions.map((q, i) => (
              <section key={q.qid} className="mt-4 border-t border-line pt-4 first:mt-2 first:border-0 first:pt-0">
                <p className="text-small font-semibold text-ink">
                  Q{i + 1}. {q.text}
                </p>
                <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-relaxed text-ink">{q.versions[q.versions.length - 1]?.body ?? <span className="text-muted">아직 작성하지 않았어요.</span>}</p>
              </section>
            ))}
          </div>
        )}

        <section className="card rise mt-4" style={{ animationDelay: '200ms' }}>
          <SectionTitle>지원 현황</SectionTitle>
          <ol className="space-y-3">
            {[
              { label: '자소서 작성 완료', done: allDone, date: short(app.completedAt) || (allDone ? '오늘' : '') },
              { label: submitted ? '서류 제출' : '서류 제출 (예정)', done: submitted, date: submitted ? short(app.submittedAt) : app.deadline ? `${short(app.deadline)} 마감 ${ddayLabel(app.deadline)}` : '마감 미정' },
              { label: '면접 준비', done: stageIndex >= STAGES.indexOf('면접'), date: stageIndex >= STAGES.indexOf('면접') ? '진행 중' : '' },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <Icon name={s.done ? 'check-circle' : 'circle'} size={22} className={s.done ? 'text-success' : 'text-line'} />
                <span className={`flex-1 text-[0.875rem] ${s.done ? 'text-ink' : 'text-muted'}`}>{s.label}</span>
                <span className="text-caption text-muted">{s.date}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {STAGES.map((s) => (
              <button key={s} type="button" aria-pressed={app.stage === s} onClick={() => void update({ stage: s as Stage })} className={`chip press shrink-0 min-h-[34px] py-1 ${app.stage === s ? 'chip-on' : ''}`}>
                {s}
              </button>
            ))}
          </div>
          {app.stage === '최종' && (
            <Link to={`/celebrate/${app.id}`} viewTransition className="btn-secondary mt-3 w-full">
              <Icon name="sparkle" size={16} />
              합격 축하 보기
            </Link>
          )}
          {app.deadline && <p className="mt-3 text-caption text-muted">마감 {formatDate(app.deadline)}</p>}
        </section>

        <button type="button" onClick={() => setMore((v) => !v)} className="btn-ghost mt-3 w-full">
          <Icon name={more ? 'chevron-down' : 'chevron'} size={14} />
          공고 정보와 체크리스트 {more ? '접기' : '보기'}
        </button>
        {more && (
          <div className="space-y-3">
            <section className="card">
              <SectionTitle>공고에서 뽑은 것</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {app.keywords.map((k) => (
                  <span key={k} className="tag">
                    {k}
                  </span>
                ))}
              </div>
              {app.values && <p className="mt-3 text-small text-muted">인재상: {app.values}</p>}
              {app.postSummary && <p className="mt-2 text-small text-muted">{app.postSummary}</p>}
            </section>
            <section className="card">
              <SectionTitle right={<span className="text-caption text-muted">{app.checklist.filter((c) => c.done).length}/{app.checklist.length}</span>}>체크리스트</SectionTitle>
              <ul className="space-y-1">
                {app.checklist.map((c, i) => (
                  <li key={`${c.item}-${i}`}>
                    <button type="button" onClick={() => void update({ checklist: app.checklist.map((x, k) => (k === i ? { ...x, done: !x.done } : x)) })} className="press flex min-h-[44px] w-full items-center gap-3 rounded-tile px-1 text-left">
                      <Icon name={c.done ? 'check-circle' : 'circle'} size={22} className={c.done ? 'text-success' : 'text-line'} />
                      <span className={`text-[0.875rem] ${c.done ? 'text-muted line-through' : 'text-ink'}`}>{c.item}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input className="field" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="항목 추가" />
                <button
                  type="button"
                  onClick={() => {
                    if (!newItem.trim()) return;
                    void update({ checklist: [...app.checklist, { item: newItem.trim(), done: false }] });
                    setNewItem('');
                  }}
                  className="btn-secondary shrink-0 px-4"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {submitted ? (
          <Link to={`/mock/setup?app=${app.id}&mode=app`} viewTransition className="btn-primary w-full">
            <Icon name="mic" size={18} />이 지원 건으로 모의 면접
          </Link>
        ) : (
          <button type="button" onClick={() => void submit()} disabled={!allDone} className="btn-primary w-full">
            {allDone ? '이 자소서로 제출하기' : `문항 ${app.questions.filter((q) => q.status !== '완료').length}개를 먼저 완료해 줘`}
            {allDone && <Icon name="arrow" size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
