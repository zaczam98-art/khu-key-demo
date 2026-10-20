import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Field, Sheet } from '../../components/ui';
import { JOBS } from '../../data/jobs';
import { FOCUS_OPTIONS, INTERVIEW_TYPES } from '../../data/rubric';
import { db, type InterviewType } from '../../lib/db';
import { useAsync } from '../../lib/hooks';

// 면접 2. 면접 준비 및 설정 (design/04_면접.png 2번)
export const MOCK_SETUP_KEY = 'khu-mock-setup';
export type MockSetup = { type: InterviewType; appId?: string; company?: string; job?: string; focus: string[]; useEssay: boolean };

export function readMockSetup(): MockSetup {
  try {
    const raw = localStorage.getItem(MOCK_SETUP_KEY);
    if (raw) return { focus: [], useEssay: false, ...(JSON.parse(raw) as Partial<MockSetup>), type: (JSON.parse(raw) as MockSetup).type ?? '실무' };
  } catch {
    // 무시
  }
  return { type: '실무', focus: [], useEssay: false };
}

export function MockSetupScreen() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'free';
  const { data } = useAsync(async () => ({ apps: await db.applications.toArray(), profile: await db.profile.get('me') }), []);
  const [type, setType] = useState<InterviewType>('실무');
  const [appId, setAppId] = useState<string>(params.get('app') ?? '');
  const [job, setJob] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const [useEssay, setUseEssay] = useState(mode === 'essay');
  const [picker, setPicker] = useState(false);

  // 진입 방식에 따라 기본값을 채웁니다.
  useEffect(() => {
    if (!data) return;
    const latest = [...data.apps].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
    if ((mode === 'app' || mode === 'essay') && !appId && latest) setAppId(latest.id);
    if (mode === 'job' && !job) setJob(data.profile?.targetJobs[0]?.name ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const app = data?.apps.find((a) => a.id === appId);
  const companyLabel = app ? app.company : job ? '직무 연습' : '자유 연습';
  const jobLabel = app ? app.job : job || data?.profile?.targetJobs[0]?.name || '직무 미정';

  const start = async () => {
    const setup: MockSetup = { type, appId: app?.id, company: app?.company, job: app?.job ?? (job || data?.profile?.targetJobs[0]?.name), focus, useEssay };
    try {
      localStorage.setItem(MOCK_SETUP_KEY, JSON.stringify(setup));
    } catch {
      // 무시
    }
    await db.chatLogs.delete('log:mock');
    nav('/mock/session', { viewTransition: true });
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="면접 설정" back="/mock" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <button type="button" onClick={() => setPicker(true)} className="card rise press flex w-full items-center gap-3 !p-4 text-left">
          <span className="tile bg-lavender text-title text-primary">{companyLabel.slice(0, 1)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold text-ink">{companyLabel}</span>
            <span className="block text-small text-muted">
              {jobLabel} <span className="mx-1 text-line">|</span> 신입
            </span>
          </span>
          <span className="flex items-center text-small text-primary">
            변경하기 <Icon name="chevron" size={16} />
          </span>
        </button>

        <section className="rise mt-5" style={{ animationDelay: '80ms' }}>
          <h2 className="label">면접 유형</h2>
          <div className="flex flex-wrap gap-2">
            {INTERVIEW_TYPES.map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`chip press ${type === t ? 'chip-on' : ''}`}>
                {t} 면접
              </button>
            ))}
          </div>
        </section>

        <section className="rise mt-5" style={{ animationDelay: '160ms' }}>
          <h2 className="label">연습 방향 (선택)</h2>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map((f) => {
              const on = focus.includes(f);
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFocus((p) => (on ? p.filter((x) => x !== f) : [...p, f]))} className={`chip press ${on ? 'chip-on' : ''}`}>
                  {f}
                </button>
              );
            })}
          </div>
        </section>

        <button type="button" role="switch" aria-checked={useEssay} onClick={() => setUseEssay((v) => !v)} className="card rise press mt-5 flex w-full items-center gap-3 !p-4 text-left" style={{ animationDelay: '240ms' }}>
          <span className="tile h-10 w-10 bg-lavender text-primary">
            <Icon name="doc" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-semibold text-ink">내 자소서 기반 맞춤 질문</span>
            <span className="block text-caption text-muted">저장된 자소서와 경험을 분석해 더 정밀한 질문을 준비할게요.</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-base ${useEssay ? 'bg-primary' : 'bg-line'}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-base ease-app ${useEssay ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
        </button>
        <p className="mt-3 flex items-center gap-1 text-caption text-muted">
          <Icon name="mic" size={12} />
          질문은 소리로 읽어 주고, 답변은 녹음하거나 글로 할 수 있어요. 실제 받아쓰기는 ChatKHU 키를 넣으면 켜져요.
        </p>
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => void start()} className="btn-primary w-full">
          면접 시작하기
          <Icon name="arrow" size={18} />
        </button>
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="어떤 면접을 준비할까?">
        <Field label="지원 건">
          <select className="field" value={appId} onChange={(e) => setAppId(e.target.value)}>
            <option value="">지원 건 없이</option>
            {(data?.apps ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.company} · {a.job}
              </option>
            ))}
          </select>
        </Field>
        {!appId && (
          <div className="mt-4">
            <Field label="직무" hint="지원 건이 없으면 직무만 정해도 돼요">
              <input className="field" list="mock-jobs" value={job} onChange={(e) => setJob(e.target.value)} placeholder="예: 콘텐츠 기획자" />
              <datalist id="mock-jobs">
                {JOBS.map((j) => (
                  <option key={j.name} value={j.name} />
                ))}
              </datalist>
            </Field>
          </div>
        )}
        <button type="button" onClick={() => setPicker(false)} className="btn-primary mt-4 w-full">
          확인
        </button>
      </Sheet>
    </div>
  );
}
