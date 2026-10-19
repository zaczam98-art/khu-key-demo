import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';

// 10. 프로필 저장 완료
export function ExploreSaved() {
  const nav = useNavigate();
  return (
    <div className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-lavender via-canvas to-canvas px-6 pb-8 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="relative mt-10">
        <Character expr="heart" size={220} />
        <Icon name="heart" size={22} className="absolute -left-2 top-6 text-primary/70" />
        <Icon name="heart" size={16} className="absolute right-0 top-2 text-[#F08BB0]" />
        <Icon name="heart" size={14} className="absolute -right-4 top-20 text-primary/50" />
      </div>
      <h1 className="mt-8 whitespace-pre-line text-center text-[22px] font-bold leading-snug text-ink">{'탐색 결과가\n내 프로필에 저장됐어!'}</h1>
      <p className="mt-4 whitespace-pre-line text-center text-[14px] leading-relaxed text-muted">
        {'앞으로 자소서 작성, 면접 준비 등\n취업 준비 과정에서 이 정보를 활용할게.\n언제든지 다시 와서 더 이야기해줘! 💜'}
      </p>
      <div className="flex-1" />
      <button type="button" onClick={() => nav('/profile')} className="btn-primary w-full">
        다음 단계로 이동하기 →
      </button>
      <Link to="/" className="mt-4 text-[14px] text-muted">
        나중에 할게요
      </Link>
    </div>
  );
}
