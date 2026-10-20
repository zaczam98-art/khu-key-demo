import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, SectionTitle } from '../../components/ui';
import { ddayLabel, formatDate } from '../../lib/dday';
import { db, STAGES, type Application, type Stage } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { useAppStore } from '../../store';

// 지원 건 상세: 단계, 마감, 키워드, 문항, 체크리스트
const STATUS_TONE = { 미작성: 'line', 작성중: 'soft', 완료: 'success' } as const;

export function EssayDetail() {
  const nav = useNavigate();
  const { id = '' } = useParams();
  const showToast = useAppStore((s) => s.showToast);
  const { data: app, loading, reload } = useAsync(() => db.applications.get(id), [id]);
  const [showPost, setShowPost] = useState(false);
  const [newItem, setNewItem] = useState('');

  const update = async (patch: Partial<Application>) => {
    if (!app) return;
    await db.applications.put({ ...app, ...patch });
    reload();
  };
  const setStage = (stage: Stage) => void update({ stage });
  const toggle = (i: number) => void update({ checklist: app!.checklist.map((c, k) => (k === i ? { ...c, done: !c.done } : c)) });
  const addItem = () => {
    if (!newItem.trim() || !app) return;
    void update({ checklist: [...app.checklist, { item: newItem.trim(), done: false }] });
    setNewItem('');
  };
  const remove = async () => {
    if (!app || !window.confirm(`${app.company} 지원 건을 지울까요? 문항 초안도 함께 지워져요.`)) return;
    await db.applications.delete(app.id);
    await db.tasks.where('appId').equals(app.id).delete();
    showToast('지원 건을 지웠어요');
    nav('/essay', { replace: true, viewTransition: true });
  };

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (!app) return <div className="p-4"><EmptyState expr="think" title="지원 건을 찾을 수 없어" action={{ label: '자소서로', to: '/essay' }} /></div>;
  const doneCount = app.checklist.filter((c) => c.done).length;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader
        title="지원 건"
        back="/essay"
        right={
          <button type="button" aria-label="지우기" onClick={() => void remove()} className="press flex h-11 w-11 items-center justify-center rounded-full text-muted">
            <Icon name="trash" size={20} />
          </button>
        }
      />
      <div className="flex-1 px-4 pb-8 pt-2">
        <div className="rise flex items-start justify-between gap-3">
          <div>
            <h2 className="text-title text-ink">{app.company}</h2>
            <p className="mt-0.5 text-body text-muted">{app.job}</p>
          </div>
          <span className={`tile ${app.deadline ? 'bg-lavender text-primary' : 'bg-canvas text-muted'} flex-col text-caption font-bold`}>{ddayLabel(app.deadline)}</span>
        </div>
        {app.deadline && (
          <p className="rise mt-2 flex items-center gap-1 text-small text-muted" style={{ animationDelay: '60ms' }}>
            <Icon name="calendar" size={14} />
            {formatDate(app.deadline)} 마감
          </p>
        )}

        <div className="rise mt-4 flex gap-2 overflow-x-auto pb-1" style={{ animationDelay: '120ms' }}>
          {STAGES.map((s) => (
            <button key={s} type="button" aria-pressed={app.stage === s} onClick={() => setStage(s)} className={`chip press shrink-0 ${app.stage === s ? 'chip-on' : ''}`}>
              {s}
            </button>
          ))}
        </div>

        {(app.keywords.length > 0 || app.values) && (
          <section className="card rise mt-4" style={{ animationDelay: '180ms' }}>
            <SectionTitle>공고에서 뽑은 것</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {app.keywords.map((k) => (
                <span key={k} className="tag">
                  {k}
                </span>
              ))}
            </div>
            {app.values && <p className="mt-3 text-small text-muted">인재상: {app.values}</p>}
            {app.postText && (
              <button type="button" onClick={() => setShowPost((v) => !v)} className="btn-ghost -ml-3 mt-1">
                <Icon name={showPost ? 'chevron-down' : 'chevron'} size={14} />
                공고 본문 {showPost ? '접기' : '보기'}
              </button>
            )}
            {showPost && <pre className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-tile bg-canvas p-3 text-caption text-muted">{app.postText}</pre>}
          </section>
        )}

        <section className="mt-5">
          <SectionTitle>문항 {app.questions.length ? <span className="text-muted">{app.questions.filter((q) => q.status === '완료').length}/{app.questions.length}</span> : null}</SectionTitle>
          {app.questions.length === 0 ? (
            <p className="text-small text-muted">문항이 없어요. 지원 건을 지우고 문항과 함께 다시 추가해 주세요.</p>
          ) : (
            <ul className="space-y-2">
              {app.questions.map((q, i) => (
                <li key={q.qid}>
                  <Link to={`/essay/${app.id}/q/${q.qid}`} viewTransition className="card rise press flex items-center gap-3 !p-4" style={{ animationDelay: `${220 + i * 70}ms` }}>
                    <span className="tile h-10 w-10 bg-lavender text-small font-bold text-primary">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-small text-ink">{q.text}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <Badge tone={STATUS_TONE[q.status]}>{q.status}</Badge>
                        <span className="text-caption text-muted">
                          {q.limit}자 · 버전 {q.versions.length}
                        </span>
                      </span>
                    </span>
                    <Icon name="chevron" size={18} className="text-muted/60" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card rise mt-5" style={{ animationDelay: '400ms' }}>
          <SectionTitle right={<span className="text-caption text-muted">{doneCount}/{app.checklist.length}</span>}>체크리스트</SectionTitle>
          <ul className="space-y-1">
            {app.checklist.map((c, i) => (
              <li key={`${c.item}-${i}`}>
                <button type="button" onClick={() => toggle(i)} className="press flex min-h-[44px] w-full items-center gap-3 rounded-tile px-1 text-left">
                  <Icon name={c.done ? 'check-circle' : 'circle'} size={22} className={c.done ? 'text-success' : 'text-line'} />
                  <span className={`text-[0.875rem] ${c.done ? 'text-muted line-through' : 'text-ink'}`}>{c.item}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input className="field" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="항목 추가" onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && (e.preventDefault(), addItem())} />
            <button type="button" onClick={addItem} className="btn-secondary shrink-0 px-4">
              <Icon name="plus" size={16} />
            </button>
          </div>
        </section>

        <button type="button" onClick={() => nav(`/mock?app=${app.id}`, { viewTransition: true })} className="btn-secondary rise mt-5 w-full" style={{ animationDelay: '480ms' }}>
          <Icon name="mic" size={18} />이 지원 건으로 모의 면접
        </button>
      </div>
    </div>
  );
}
