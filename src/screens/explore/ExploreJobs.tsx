import { useState } from 'react';
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
  const showToast = useAppStore((s) => s.showToast);
  const [saving, setSaving] = useState(false);
  if (!result) return <Navigate to="/explore" replace />;

  const saveAll = async () => {
    setSaving(true);
    try {
      await saveExploreResult(result);
      showToast('프로필에 저장했어요 💜');
      nav('/explore/saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TitleHeader title="추천 직무" back="/explore/summary" />
      <div className="flex-1 space-y-3 px-4 pb-8 pt-2">
        <p className="rise text-[13px] text-muted">대화에서 찾은 성향에 가까운 순서예요. 카드를 누르면 자세히 볼 수 있어.</p>
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
              className="card rise press flex w-full items-start gap-3 text-left"
              style={{ animationDelay: `${120 + i * 110}ms` }}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ICON_STYLE[i % ICON_STYLE.length]}`}>
                <Icon name={entry?.icon ?? 'brand'} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[16px] font-semibold text-ink">{job.name}</span>
                  {i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">BEST</span>}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted">{job.summary}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <span className="mt-3 text-muted/60">›</span>
            </button>
          );
        })}
        <button type="button" onClick={() => void saveAll()} disabled={saving} className="btn-primary rise mt-4 w-full" style={{ animationDelay: '480ms' }}>
          {saving ? (
            <>
              <span className="spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
              저장하는 중
            </>
          ) : (
            <>
              이 결과를 내 프로필에 저장하기
              <Icon name="arrow" size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
