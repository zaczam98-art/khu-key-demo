import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, Spinner } from '../../components/ui';
import { findJob } from '../../data/jobs';
import { saveExploreResult } from '../../lib/profile';
import { useAppStore } from '../../store';

// 8. 추천 직무 결과
const ICON_STYLE = ['bg-lavender text-primary', 'bg-info/10 text-info', 'bg-success/10 text-success'];

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
      nav('/explore/saved', { viewTransition: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="추천 직무" back="/explore/summary" />
      <div className="flex-1 space-y-3 px-4 pb-8 pt-2">
        <p className="rise text-small text-muted">대화에서 찾은 성향에 가까운 순서예요. 카드를 누르면 자세히 볼 수 있어.</p>
        {result.jobs.map((job, i) => {
          const entry = findJob(job.name);
          return (
            <button
              key={job.name}
              type="button"
              onClick={() => {
                selectJob(i);
                nav(`/explore/jobs/${i}`, { viewTransition: true });
              }}
              className="card rise press flex w-full items-start gap-3 text-left"
              style={{ animationDelay: `${120 + i * 110}ms` }}
            >
              <span className={`tile ${ICON_STYLE[i % ICON_STYLE.length]}`} style={{ viewTransitionName: `job-tile-${i}` }}>
                <Icon name={entry?.icon ?? 'brand'} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-body font-semibold text-ink">{job.name}</span>
                  {i === 0 && <Badge tone="solid">BEST</Badge>}
                </span>
                <span className="mt-1 block text-small text-muted">{job.summary}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <Icon name="chevron" size={18} className="mt-3 text-muted/60" />
            </button>
          );
        })}
        <button type="button" onClick={() => void saveAll()} disabled={saving} className="btn-primary rise mt-4 w-full" style={{ animationDelay: '480ms' }}>
          {saving ? (
            <>
              <Spinner /> 저장하는 중
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
