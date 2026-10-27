import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';
import { Spinner } from '../../components/ui';
import { db } from '../../lib/db';
import { renderShareCard, shareOrDownload } from '../../lib/shareCard';
import { useAppStore } from '../../store';

// 7. 탐색 결과 요약. 우상단 아이콘은 결과를 이미지 카드로 저장·공유합니다.
export function ExploreSummary() {
  const nav = useNavigate();
  const result = useAppStore((s) => s.result);
  const showToast = useAppStore((s) => s.showToast);
  const [sharing, setSharing] = useState(false);
  if (!result) return <Navigate to="/explore" replace />;

  const share = async () => {
    setSharing(true);
    try {
      const profile = await db.profile.get('me');
      const blob = await renderShareCard(result, profile?.nickname);
      const how = await shareOrDownload(blob, 'cookie-result.png');
      showToast(how === 'shared' ? '공유했어요' : '이미지로 저장했어요');
    } catch {
      try {
        await navigator.clipboard.writeText(`루다가 발견한 키워드: ${result.keywords.join(', ')}\n${result.traits.map((t) => `- ${t}`).join('\n')}`);
        showToast('이미지 대신 글로 복사했어요');
      } catch {
        showToast('이 브라우저에서는 저장할 수 없어요');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader
        title="탐색 결과 요약"
        back="/explore/chat"
        right={
          <button type="button" aria-label="결과 카드 저장" onClick={() => void share()} disabled={sharing} className="press flex h-11 w-11 items-center justify-center rounded-full text-ink">
            {sharing ? <Spinner /> : <Icon name="share" size={22} />}
          </button>
        }
      />
      <div className="flex-1 px-4 pb-8 pt-2">
        <section className="rise rounded-card bg-lavender p-5">
          <h2 className="flex items-center gap-2 text-body font-semibold text-ink">
            <Character expr="explain" size={28} className="rounded-full bg-surface" />
            루다가 발견한 너의 키워드
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.keywords.map((keyword, i) => (
              <span key={keyword} className="pop rounded-full bg-surface px-3 py-1.5 text-small text-ink shadow-card" style={{ animationDelay: `${150 + i * 80}ms` }}>
                {keyword}
              </span>
            ))}
          </div>
        </section>
        <h3 className="rise mt-6 section-title" style={{ animationDelay: '300ms' }}>
          이런 성향을 가진 것 같아!
        </h3>
        <ul className="mt-3 space-y-3">
          {result.traits.map((trait, i) => (
            <li key={trait} className="rise flex items-start gap-2 text-[0.875rem] leading-relaxed text-ink" style={{ animationDelay: `${400 + i * 90}ms` }}>
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
              {trait}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => nav('/explore/jobs', { viewTransition: true })} className="btn-primary rise mt-6 w-full" style={{ animationDelay: '850ms' }}>
          추천 직무 보기
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
