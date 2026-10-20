import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Field, Spinner } from '../../components/ui';
import { JOBS } from '../../data/jobs';
import { extractPost, fetchJobPost } from '../../lib/api';
import { dateInputToIso } from '../../lib/dday';
import { db, type Application } from '../../lib/db';
import { nowIso, uid } from '../../lib/ids';
import { mask } from '../../lib/mask';
import { useAppStore } from '../../store';

// 지원 건 추가. 공고 링크 1건을 가져오거나 본문을 붙여 넣고, 키워드·문항을 뽑습니다. (CLAUDE.md 9절)
type Q = { text: string; limit: number };
const DEFAULT_CHECKLIST = ['공고 요건 다시 읽기', '자소서 전체 문항 완료', '맞춤법과 글자 수 확인', '제출 완료'];

export function EssayNew() {
  const nav = useNavigate();
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const [company, setCompany] = useState('');
  const [job, setJob] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [values, setValues] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState<Q[]>([{ text: '', limit: 500 }]);
  const [fetching, setFetching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const grab = async () => {
    if (!url.trim()) return;
    setFetching(true);
    try {
      const r = await fetchJobPost(url.trim());
      setText(r.text);
      showToast(r.demo ? '체험 모드 공고를 불러왔어요' : '공고를 가져왔어요');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setFetching(false);
    }
  };
  const analyze = async () => {
    if (!text.trim()) {
      showToast('공고 본문을 먼저 넣어 줘');
      return;
    }
    setAnalyzing(true);
    try {
      const r = await extractPost(mask(text));
      note(r.demo, r.credits);
      setKeywords(r.result.keywords);
      setValues(r.result.values);
      if (r.result.deadline) setDeadline(r.result.deadline);
      if (r.result.questions.length) setQuestions(r.result.questions);
      showToast('키워드와 문항을 뽑았어요');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !job.trim()) {
      showToast('회사와 직무를 적어 줘');
      return;
    }
    setSaving(true);
    const qs = questions.filter((q) => q.text.trim());
    const app: Application = {
      id: uid(),
      company: company.trim(),
      job: job.trim(),
      postUrl: url.trim() || undefined,
      postText: text.trim() || undefined,
      keywords,
      values: values || undefined,
      deadline: deadline ? dateInputToIso(deadline) : undefined,
      stage: '관심',
      questions: qs.map((q) => ({ qid: uid(), text: q.text.trim(), limit: q.limit || 500, expIds: [], status: '미작성', versions: [] })),
      checklist: DEFAULT_CHECKLIST.map((item) => ({ item, done: false })),
    };
    await db.applications.add(app);
    if (app.deadline) {
      await db.tasks.add({ id: uid(), appId: app.id, type: '서류제출', title: `${app.company} 서류 제출`, dueAt: app.deadline, estMin: 30, done: false, priority: 0, lastNudgedAt: nowIso() });
    }
    setSaving(false);
    showToast('지원 건을 추가했어요');
    nav(`/essay/${app.id}`, { replace: true, viewTransition: true });
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="지원 건 추가" back="/essay" />
      <form onSubmit={submit} className="flex-1 space-y-5 px-4 pb-8 pt-2">
        <div className="card rise space-y-4">
          <Field label="회사">
            <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: 쿠키컴퍼니" required />
          </Field>
          <Field label="직무">
            <input className="field" list="job-names" value={job} onChange={(e) => setJob(e.target.value)} placeholder="예: 마케팅 기획자" required />
            <datalist id="job-names">
              {JOBS.map((j) => (
                <option key={j.name} value={j.name} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="card rise space-y-3" style={{ animationDelay: '80ms' }}>
          <Field label="공고 링크" hint="링크 1건만 가져와요. 로그인이 필요한 사이트는 본문을 붙여 넣어 주세요.">
            <div className="flex gap-2">
              <input className="field" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              <button type="button" onClick={() => void grab()} disabled={fetching || !url.trim()} className="btn-secondary shrink-0 px-4">
                {fetching ? <Spinner /> : <Icon name="link" size={16} />}
                가져오기
              </button>
            </div>
          </Field>
          <Field label="공고 본문">
            <textarea className="field min-h-[140px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="담당 업무, 자격 요건, 인재상, 마감일, 자소서 문항을 붙여 넣어 주세요." />
          </Field>
          <button type="button" onClick={() => void analyze()} disabled={analyzing || !text.trim()} className="btn-primary w-full">
            {analyzing ? <Spinner /> : <Icon name="wand" size={18} />}
            쿠키가 키워드·문항 뽑기
          </button>
        </div>

        <div className="card rise space-y-4" style={{ animationDelay: '160ms' }}>
          <Field label="공고 키워드" hint="쉼표로 구분">
            <input className="field" value={keywords.join(', ')} onChange={(e) => setKeywords(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="분석 뒤 자동으로 채워져요" />
          </Field>
          <Field label="회사 가치관·인재상">
            <input className="field" value={values} onChange={(e) => setValues(e.target.value)} />
          </Field>
          <Field label="접수 마감">
            <input className="field" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>

        <div className="card rise space-y-3" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between">
            <span className="label !mb-0">자소서 문항</span>
            <button type="button" onClick={() => setQuestions((q) => [...q, { text: '', limit: 500 }])} className="btn-ghost -mr-3 text-primary">
              <Icon name="plus" size={14} />
              문항 추가
            </button>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-3 w-5 text-small font-semibold text-muted">{i + 1}</span>
              <textarea className="field min-h-[56px] flex-1" value={q.text} onChange={(e) => setQuestions((qs) => qs.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} placeholder="문항 내용" />
              <input type="number" className="field w-20 px-2 text-center" value={q.limit} min={100} step={100} onChange={(e) => setQuestions((qs) => qs.map((x, k) => (k === i ? { ...x, limit: Number(e.target.value) } : x)))} aria-label="글자 수 제한" />
              <button type="button" aria-label="문항 삭제" onClick={() => setQuestions((qs) => qs.filter((_, k) => k !== i))} className="press mt-2 flex h-9 w-9 items-center justify-center rounded-full text-muted">
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <Spinner /> : <Icon name="check" size={18} />}
          지원 건 저장
        </button>
      </form>
    </div>
  );
}
