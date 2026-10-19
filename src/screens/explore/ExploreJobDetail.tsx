import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { findJob } from '../../data/jobs';
import { saveExploreResult } from '../../lib/profile';
import { useAppStore } from '../../store';

// 9. 직무 상세. 내용은 직무 사전에서 가져오고, 사전에 없으면 추출 JSON의 설명으로 대체합니다.
export function ExploreJobDetail() {
  const nav = useNavigate();
  const { index = '0' } = useParams();
  const result = useAppStore((s) => s.result);
  const [toast, setToast] = useState<string | null>(null);
  const i = Number(index);
  const job = result?.jobs[i];
  if (!result || !job) return <Navigate to="/explore/jobs" replace />;

  const entry = findJob(job.name);
  const tags = entry?.tags ?? job.tags;
  const saveOne = async () => {
    await saveExploreResult(result, i);
    setToast('관심 직무로 저장했어요 💜');
    window.setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TitleHeader title="직무 상세" back="/explore/jobs" />
      <div className="flex-1 px-4 pb-8 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-primary">
            <Icon name={entry?.icon ?? 'brand'} size={30} />
          </span>
          <div>
            <h2 className="text-[20px] font-bold text-ink">{job.name}</h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <section className="mt-6">
          <h3 className="text-[15px] font-semibold text-ink">어떤 일을 하나요?</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{entry?.description ?? job.summary}</p>
        </section>
        <section className="mt-6">
          <h3 className="text-[15px] font-semibold text-ink">주요 업무</h3>
          <ul className="mt-2 space-y-2">
            {(entry?.duties ?? []).map((duty) => (
              <li key={duty} className="flex items-start gap-2 text-[14px] text-ink">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                {duty}
              </li>
            ))}
            {!entry && <li className="text-[14px] text-muted">{job.why}</li>}
          </ul>
        </section>
        <section className="mt-6">
          <h3 className="text-[15px] font-semibold text-ink">이런 사람에게 잘 맞아요</h3>
          <ul className="mt-2 space-y-2">
            {(entry?.fits ?? [job.why]).map((fit) => (
              <li key={fit} className="flex items-start gap-2 text-[14px] leading-relaxed text-ink">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                {fit}
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={() => void saveOne()} className="btn-secondary flex-1 gap-1">
            <Icon name="heart" size={16} /> 관심 직무로 저장
          </button>
          <button type="button" onClick={() => nav('/explore/jobs')} className="btn-primary flex-1">
            관련 직무 더 보기
          </button>
        </div>
        {entry && entry.related.length > 0 && <p className="mt-4 text-center text-[12px] text-muted">관련 직무: {entry.related.join(', ')}</p>}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
