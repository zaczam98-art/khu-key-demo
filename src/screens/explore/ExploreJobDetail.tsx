import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { findJob, type JobEntry } from '../../data/jobs';
import { db } from '../../lib/db';
import { saveDictionaryJob, saveExploreResult } from '../../lib/profile';
import { useAppStore } from '../../store';

// 9. 직무 상세. 두 경로로 들어옵니다.
//   /explore/jobs/:index       추천 결과의 n번째 직무 (내용은 사전에서, 없으면 추출 JSON 설명)
//   /explore/dictionary/:name  직무 사전의 항목 (관련 직무, 프로필에서 진입)
export function ExploreJobDetail() {
  const nav = useNavigate();
  const { index, name } = useParams();
  const result = useAppStore((s) => s.result);
  const showToast = useAppStore((s) => s.showToast);
  const [saved, setSaved] = useState(false);
  const [burst, setBurst] = useState(false);
  const relatedRef = useRef<HTMLDivElement>(null);

  const fromDictionary = name !== undefined;
  const i = Number(index ?? 0);
  const resultJob = fromDictionary ? undefined : result?.jobs[i];
  const entry: JobEntry | undefined = fromDictionary ? findJob(name) : findJob(resultJob?.name ?? '');
  const title = resultJob?.name ?? entry?.name ?? '';

  useEffect(() => {
    if (!title) return;
    db.profile.get('me').then((p) => setSaved(!!p?.targetJobs.some((t) => t.name === title)));
  }, [title]);

  if (fromDictionary ? !entry : !result || !resultJob) return <Navigate to={fromDictionary ? '/profile' : '/explore/jobs'} replace />;

  const tags = entry?.tags ?? resultJob?.tags ?? [];
  const save = async () => {
    if (resultJob && result) await saveExploreResult(result, i);
    else if (entry) await saveDictionaryJob(entry);
    setSaved(true);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 500);
    showToast('관심 직무로 저장했어요 💜');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TitleHeader title="직무 상세" back={fromDictionary ? undefined : '/explore/jobs'} />
      <div className="flex-1 px-4 pb-8 pt-2">
        <div className="rise flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-primary">
            <Icon name={entry?.icon ?? 'brand'} size={30} />
          </span>
          <div>
            <h2 className="text-[20px] font-bold text-ink">{title}</h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        {resultJob?.why && (
          <p className="rise mt-4 rounded-card bg-lavender px-4 py-3 text-[13px] leading-relaxed text-ink" style={{ animationDelay: '80ms' }}>
            <span className="font-semibold text-primary">쿠키의 추천 이유 </span>
            {resultJob.why}
          </p>
        )}
        <section className="rise mt-6" style={{ animationDelay: '160ms' }}>
          <h3 className="text-[15px] font-semibold text-ink">어떤 일을 하나요?</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{entry?.description ?? resultJob?.summary}</p>
        </section>
        {entry && (
          <section className="rise mt-6" style={{ animationDelay: '240ms' }}>
            <h3 className="text-[15px] font-semibold text-ink">주요 업무</h3>
            <ul className="mt-2 space-y-2">
              {entry.duties.map((duty, k) => (
                <li key={duty} className="rise flex items-start gap-2 text-[14px] text-ink" style={{ animationDelay: `${300 + k * 60}ms` }}>
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                  {duty}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="rise mt-6" style={{ animationDelay: '420ms' }}>
          <h3 className="text-[15px] font-semibold text-ink">이런 사람에게 잘 맞아요</h3>
          <ul className="mt-2 space-y-2">
            {(entry?.fits ?? [resultJob?.why ?? '']).map((fit) => (
              <li key={fit} className="flex items-start gap-2 text-[14px] leading-relaxed text-ink">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                {fit}
              </li>
            ))}
          </ul>
        </section>
        <div className="rise mt-8 flex gap-3" style={{ animationDelay: '500ms' }}>
          <button type="button" onClick={() => void save()} disabled={saved} className={`btn-secondary flex-1 ${saved ? 'border-primary bg-lavender' : ''}`}>
            <Icon name="heart" size={16} className={`${saved ? 'text-[#F0609A]' : ''} ${burst ? 'heart-pop' : ''}`} />
            {saved ? '관심 직무로 저장됨' : '관심 직무로 저장'}
          </button>
          <button type="button" onClick={() => relatedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="btn-primary flex-1">
            관련 직무 더 보기
          </button>
        </div>
        {entry && (
          <div ref={relatedRef} className="rise mt-6" style={{ animationDelay: '560ms' }}>
            <h3 className="text-[13px] font-semibold text-muted">함께 보면 좋은 직무</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {entry.related.map((r) => {
                const related = findJob(r);
                return (
                  <Link key={r} to={`/explore/dictionary/${encodeURIComponent(r)}`} className="chip press inline-flex items-center gap-1">
                    {related && <Icon name={related.icon} size={14} />}
                    {r}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {fromDictionary && (
          <button type="button" onClick={() => nav('/profile')} className="press mt-6 w-full text-center text-[13px] text-muted underline">
            프로필로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
