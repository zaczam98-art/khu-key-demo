import { Navigate, useNavigate } from 'react-router-dom';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { useAppStore } from '../../store';

// 7. 탐색 결과 요약
export function ExploreSummary() {
  const nav = useNavigate();
  const result = useAppStore((s) => s.result);
  if (!result) return <Navigate to="/explore" replace />;

  const copy = () => {
    const text = `쿠키가 발견한 키워드: ${result.keywords.join(', ')}\n${result.traits.map((t) => `- ${t}`).join('\n')}`;
    void navigator.clipboard?.writeText(text);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TitleHeader
        title="탐색 결과 요약"
        back="/explore/chat"
        right={
          <button type="button" aria-label="결과 복사" onClick={copy} className="text-ink">
            <Icon name="download" size={22} />
          </button>
        }
      />
      <div className="flex-1 px-4 pb-8 pt-2">
        <section className="rounded-card bg-lavender p-5">
          <h2 className="text-[15px] font-semibold text-ink">쿠키가 발견한 너의 키워드</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-white px-3 py-1.5 text-[13px] text-ink shadow-card">
                {keyword}
              </span>
            ))}
          </div>
        </section>
        <h3 className="mt-6 text-[16px] font-semibold text-ink">이런 성향을 가진 것 같아!</h3>
        <ul className="mt-3 space-y-3">
          {result.traits.map((trait) => (
            <li key={trait} className="flex items-start gap-2 text-[14px] leading-relaxed text-ink">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
              {trait}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => nav('/explore/jobs')} className="btn-primary mt-8 w-full">
          추천 직무 보기 →
        </button>
      </div>
    </div>
  );
}
