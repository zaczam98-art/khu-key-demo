import { Navigate, useNavigate } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { useAppStore } from '../../store';

// 7. 탐색 결과 요약
export function ExploreSummary() {
  const nav = useNavigate();
  const result = useAppStore((s) => s.result);
  const mode = useAppStore((s) => s.mode);
  const showToast = useAppStore((s) => s.showToast);
  if (!result) return <Navigate to="/explore" replace />;

  const copy = async () => {
    const text = `쿠키가 발견한 키워드: ${result.keywords.join(', ')}\n${result.traits.map((t) => `- ${t}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('결과를 복사했어요');
    } catch {
      showToast('복사할 수 없는 브라우저예요');
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TitleHeader
        title="탐색 결과 요약"
        back="/explore/chat"
        right={
          <button type="button" aria-label="결과 복사" onClick={() => void copy()} className="press text-ink">
            <Icon name="download" size={22} />
          </button>
        }
      />
      <div className="flex-1 px-4 pb-8 pt-2">
        <section className="rise rounded-card bg-lavender p-5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            <Icon name="sparkle" size={16} className="text-primary" />
            쿠키가 발견한 너의 키워드
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.keywords.map((keyword, i) => (
              <span key={keyword} className="pop rounded-full bg-white px-3 py-1.5 text-[13px] text-ink shadow-card" style={{ animationDelay: `${150 + i * 80}ms` }}>
                {keyword}
              </span>
            ))}
          </div>
        </section>
        <h3 className="rise mt-6 text-[16px] font-semibold text-ink" style={{ animationDelay: '300ms' }}>
          이런 성향을 가진 것 같아!
        </h3>
        <ul className="mt-3 space-y-3">
          {result.traits.map((trait, i) => (
            <li key={trait} className="rise flex items-start gap-2 text-[14px] leading-relaxed text-ink" style={{ animationDelay: `${400 + i * 90}ms` }}>
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
              {trait}
            </li>
          ))}
        </ul>
        {mode === 'demo' && <p className="rise mt-5 text-center text-[12px] text-muted" style={{ animationDelay: '800ms' }}>체험 모드 결과예요. ChatKHU를 연결하면 실제 대화로 분석해요.</p>}
        <button type="button" onClick={() => nav('/explore/jobs')} className="btn-primary rise mt-6 w-full" style={{ animationDelay: '850ms' }}>
          추천 직무 보기
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
