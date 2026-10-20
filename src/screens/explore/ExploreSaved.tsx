import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';

// 10. 프로필 저장 완료
const HEARTS = [
  { left: '8%', top: '55%', size: 16, delay: '0s', duration: '2.8s' },
  { left: '22%', top: '30%', size: 12, delay: '0.6s', duration: '3.2s' },
  { left: '72%', top: '28%', size: 14, delay: '0.3s', duration: '3s' },
  { left: '86%', top: '50%', size: 18, delay: '0.9s', duration: '2.6s' },
  { left: '50%', top: '12%', size: 10, delay: '1.2s', duration: '3.4s' },
];

export function ExploreSaved() {
  const nav = useNavigate();
  return (
    <div className="flex min-h-full flex-col items-center bg-gradient-to-b from-lavender via-canvas to-canvas px-6 pb-8 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="relative mt-8 flex h-[260px] w-full items-center justify-center">
        {HEARTS.map((h, i) => (
          <Icon
            key={i}
            name="heart"
            size={h.size}
            fill="#F08BB0"
            className="drift absolute text-[#F08BB0]"
            style={{ left: h.left, top: h.top, animationDelay: h.delay, animationDuration: h.duration }}
          />
        ))}
        <Icon name="sparkle" size={20} className="pop absolute left-[18%] top-[10%] text-primary/60" style={{ animationDelay: '0.4s' }} />
        <Icon name="sparkle" size={14} className="pop absolute right-[16%] top-[70%] text-primary/50" style={{ animationDelay: '0.9s' }} />
        <Character expr="heart" size={220} float className="pop" />
      </div>
      <h1 className="rise mt-6 whitespace-pre-line text-center text-title text-ink" style={{ animationDelay: '200ms' }}>
        {'탐색 결과가\n내 프로필에 저장됐어!'}
      </h1>
      <p className="rise mt-4 whitespace-pre-line text-center text-[0.875rem] leading-relaxed text-muted" style={{ animationDelay: '350ms' }}>
        {'앞으로 자소서 작성, 면접 준비 등\n취업 준비 과정에서 이 정보를 활용할게.\n언제든지 다시 와서 더 이야기해줘! 💜'}
      </p>
      <div className="flex-1" />
      <button type="button" onClick={() => nav('/profile/experience/new', { viewTransition: true })} className="btn-primary rise w-full" style={{ animationDelay: '500ms' }}>
        다음 단계로 이동하기
        <Icon name="arrow" size={18} />
      </button>
      <Link to="/" viewTransition className="btn-ghost rise mt-2" style={{ animationDelay: '600ms' }}>
        나중에 할게요
      </Link>
    </div>
  );
}
