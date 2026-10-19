import { Navigate, useNavigate } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { findJob } from '../../data/jobs';
import { saveExploreResult } from '../../lib/profile';
import { useAppStore } from '../../store';

// 8. 추천 직무 결과
const ICON_STYLE = ['bg-lavender text-primary', 'bg-[#E6F0FF] text-[#4F7CF6]', 'bg-[#EAF8F0] text-success'];

export function ExploreJobs() {
  const nav = useNavigate();
  const result = useAppStore((s) => s.result);
  const selectJob = useAppStore((s) => s.selectJob);
  if (!result) return <Navigate to="/explore" replace />;

  const saveAll = async () => {
    await saveExploreResult(result);
    nav('/explore/saved');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TitleHeader title="추천 직무" back="/explore/summary" />
      <div className="flex-1 space-y-3 px-4 pb-8 pt-2">
        {result.jobs.map((job, i) => {
          const entry = findJob(job.name);
          return (
            <button
              key={job.name}
              type="button"
              onClick={() => {
                selectJob(i);
                nav(`/explore/jobs/${i}`);
              }}
              className="card flex w-full items-start gap-3 text-left"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ICON_STYLE[i % ICON_STYLE.length]}`}>
                <Icon name={entry?.icon ?? 'brand'} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold text-ink">{job.name}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted">{job.summary}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
        <button type="button" onClick={() => void saveAll()} className="btn-primary mt-4 w-full">
          이 결과를 내 프로필에 저장하기 →
        </button>
      </div>
    </div>
  );
}
