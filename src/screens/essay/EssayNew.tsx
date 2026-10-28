import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, Field, Spinner } from '../../components/ui';
import { JOBS } from '../../data/jobs';
import { extractPost, fetchJobPost } from '../../lib/api';
import { dateInputToIso, ddayLabel } from '../../lib/dday';
import { db, type Application } from '../../lib/db';
import { nowIso, uid } from '../../lib/ids';
import { mask } from '../../lib/mask';
import type { PostExtract } from '../../lib/schema';
import { useAppStore } from '../../store';

// 자소서 2. 지원 건 추가 → 채용공고 분석 및 문항 제안. 공고는 사용자가 넣은 링크 1건만 가져옵니다. (CLAUDE.md 9절)
const DEFAULT_CHECKLIST = ['공고 요건 다시 읽기', '자소서 전체 문항 완료', '맞춤법과 글자 수 확인', '제출 완료'];
const TABS = ['채용공고 요약', '핵심 키워드', '자소서 문항'] as const;

export function EssayNew() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const [company, setCompany] = useState(params.get('company') ?? '');
  const [job, setJob] = useState(params.get('job') ?? '');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [fetching, setFetching] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null); // 링크 가져오기 실패 이유. 토스트는 금방 사라져서 입력란 아래에 남겨 둡니다.
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PostExtract | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('채용공고 요약');
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get('focus') === 'link') urlRef.current?.focus();
  }, [params]);

  const grab = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setLinkError(null);
    try {
      const r = await fetchJobPost(url.trim());
      setText(r.text);
      showToast(r.demo ? '체험 모드 공고를 불러왔어요' : '공고를 가져왔어요');
    } catch (e) {
      setLinkError((e as Error).message);
    } finally {
      setFetching(false);
    }
  };
  const analyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !job.trim()) {
      showToast('회사와 직무를 적어 줘');
      return;
    }
    if (!text.trim()) {
      showToast('공고 본문을 먼저 넣어 줘');
      return;
    }
    setAnalyzing(true);
    try {
      const r = await extractPost(mask(text));
      note(r.demo, r.credits);
      setResult(r.result);
      setTab('채용공고 요약');
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };
  const save = async () => {
    if (!result) return;
    setSaving(true);
    const deadline = result.deadline ? dateInputToIso(result.deadline) : undefined;
    const app: Application = {
      id: uid(),
      company: company.trim(),
      job: job.trim(),
      postUrl: url.trim() || undefined,
      postText: text.trim() || undefined,
      postSummary: result.summary || undefined,
      keywords: result.keywords,
      values: result.values || undefined,
      deadline,
      stage: '관심',
      questions: (result.questions.length ? result.questions : [{ text: '지원 동기와 입사 후 포부를 작성해 주세요.', limit: 700 }]).map((q) => ({ qid: uid(), text: q.text, limit: q.limit || 500, expIds: [], status: '미작성', versions: [] })),
      checklist: DEFAULT_CHECKLIST.map((item) => ({ item, done: false })),
      createdAt: nowIso(),
    };
    await db.applications.add(app);
    if (deadline) await db.tasks.add({ id: uid(), appId: app.id, type: '서류제출', title: `${app.company} 서류 제출`, dueAt: deadline, estMin: 30, done: false, priority: 0, lastNudgedAt: nowIso() });
    setSaving(false);
    showToast('지원 건을 추가했어요');
    nav(`/essay/${app.id}/q/${app.questions[0].qid}`, { replace: true, viewTransition: true });
  };

  // ---- 2단계: 채용공고 분석 및 문항 제안
  if (result) {
    return (
      <div className="flex min-h-full flex-col bg-canvas">
        <TitleHeader title={`${company} · ${job}`} back={undefined} right={<button type="button" onClick={() => setResult(null)} className="btn-ghost -mr-3 min-h-[36px] text-primary">다시</button>} />
        <div className="flex-1 px-4 pb-6 pt-1">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`chip press flex-1 justify-center ${tab === t ? 'chip-on' : ''}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="card rise mt-4 flex items-center gap-3 !p-4">
            <span className="tile bg-lavender text-title text-primary">{company.trim().slice(0, 1) || 'A'}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold text-ink">
                {company} {job} (신입)
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-caption text-muted">
                <Badge tone={result.deadline ? 'warn' : 'line'}>마감 {result.deadline ? ddayLabel(dateInputToIso(result.deadline)) : '미정'}</Badge>
                <span>신입</span>
              </span>
            </span>
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-small text-primary">
              전체 보기 ›
            </button>
          </div>
          {showAll && <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-tile bg-surface p-3 text-caption text-muted">{text}</pre>}

          {tab === '채용공고 요약' && (
            <section className="card rise mt-4" style={{ animationDelay: '80ms' }}>
              <h2 className="section-title">채용공고 요약</h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">{result.summary || '요약이 없어요. 본문을 확인해 주세요.'}</p>
              {result.values && <p className="mt-3 text-small text-muted">인재상: {result.values}</p>}
            </section>
          )}
          {tab === '핵심 키워드' && (
            <section className="rise mt-4" style={{ animationDelay: '80ms' }}>
              <h2 className="section-title">핵심 키워드</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.keywords.map((k, i) => (
                  <span key={k} className="pop rounded-full bg-lavender px-3 py-1.5 text-small text-primary" style={{ animationDelay: `${i * 60}ms` }}>
                    {k}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-caption text-muted">초안을 쓸 때 이 키워드가 2개 이상 들어가도록 루다가 챙겨요.</p>
            </section>
          )}
          {tab === '자소서 문항' && (
            <section className="rise mt-4" style={{ animationDelay: '80ms' }}>
              <h2 className="section-title">자소서 문항 ({result.questions.length}개)</h2>
              <ul className="mt-3 space-y-2">
                {result.questions.map((q, i) => (
                  <li key={i} className="card flex items-start gap-3 !p-4">
                    <span className="tile h-9 w-9 bg-lavender text-small font-bold text-primary">Q{i + 1}</span>
                    <span className="text-[0.875rem] leading-relaxed text-ink">
                      {q.text} <span className="text-muted">({q.limit}자)</span>
                    </span>
                  </li>
                ))}
                {result.questions.length === 0 && <li className="text-small text-muted">공고에 문항이 없어요. 기본 문항 1개로 시작하고 지원 건에서 고칠 수 있어요.</li>}
              </ul>
            </section>
          )}
        </div>
        <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner /> : null}
            이 공고로 자소서 작성하기
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ---- 1단계: 회사·직무·공고 입력
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="지원 건 추가" back="/essay" />
      <form onSubmit={analyze} className="flex-1 space-y-4 px-4 pb-8 pt-1">
        <div className="rise flex items-start gap-3">
          <Character expr={fetching || analyzing ? 'search' : 'write'} size={44} className="shrink-0 rounded-full bg-lavender" />
          <div className="bubble-bot">{fetching ? '공고를 읽어 오는 중이야...' : analyzing ? '공고에서 키워드와 문항을 찾는 중이야...' : '회사와 직무, 그리고 공고를 알려 줘.\n키워드와 문항을 내가 뽑아 줄게!'}</div>
        </div>
        <div className="card rise space-y-4" style={{ animationDelay: '60ms' }}>
          <Field label="회사">
            <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: A기업" required />
          </Field>
          <Field label="직무">
            <input className="field" list="job-names" value={job} onChange={(e) => setJob(e.target.value)} placeholder="예: 콘텐츠 기획자" required />
            <datalist id="job-names">
              {JOBS.map((j) => (
                <option key={j.name} value={j.name} />
              ))}
            </datalist>
          </Field>
        </div>
        <div className="card rise space-y-3" style={{ animationDelay: '120ms' }}>
          <Field label="공고 링크" hint={linkError ? undefined : '링크 1건만 가져와요. 로그인이 필요한 사이트는 본문을 붙여 넣어 주세요.'}>
            <div className="flex gap-2">
              <input
                ref={urlRef}
                className={`field ${linkError ? 'border-warn ring-2 ring-warn/20' : ''}`}
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setLinkError(null);
                }}
                placeholder="https://"
              />
              <button type="button" onClick={() => void grab()} disabled={fetching || !url.trim()} className="btn-secondary shrink-0 px-4">
                {fetching ? <Spinner /> : <Icon name="link" size={16} />}
                가져오기
              </button>
            </div>
            {linkError && (
              <span role="alert" className="mt-1 block text-caption text-warn">
                {linkError}
              </span>
            )}
          </Field>
          <Field label="공고 본문">
            <textarea className="field min-h-[160px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="담당 업무, 자격 요건, 인재상, 마감일, 자소서 문항을 붙여 넣어 주세요." />
          </Field>
        </div>
        <button type="submit" disabled={analyzing} className="btn-primary w-full">
          {analyzing ? <Spinner /> : <Icon name="wand" size={18} />}
          루다가 공고 분석하기
        </button>
      </form>
    </div>
  );
}
