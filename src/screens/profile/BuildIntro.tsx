import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { BackButton } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge } from '../../components/ui';

// 프로필 구축 마법사 공통 헤더. "프로필 구축 n/5"
export function BuildHeader({ step, back }: { step: number; back?: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-canvas/95 px-4 backdrop-blur">
      <BackButton to={back} />
      <div className="flex flex-1 items-center justify-end gap-2">
        <Badge tone="soft">프로필 구축 {step}/5</Badge>
      </div>
    </header>
  );
}

// 1. 프로필 구축 시작
export function BuildIntro() {
  const nav = useNavigate();
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-lavender via-canvas to-canvas">
      <BuildHeader step={1} back="/profile" />
      <div className="relative flex flex-1 items-center justify-center px-6 py-4">
        <Icon name="sparkle" size={22} className="pop absolute right-[18%] top-[24%] text-primary/60" style={{ animationDelay: '0.4s' }} />
        <Character expr="default" size={230} float />
      </div>
      <div className="card rise mx-4 mb-6 text-center">
        <h1 className="text-title text-ink">이제 너에 대해 더 알아갈게! 🥰</h1>
        <p className="mt-3 whitespace-pre-line text-body text-muted">{'지금까지 해온 경험들을 정리하면\n자소서, 면접까지 쭉 활용할 수 있어.\n하나씩 같이 정리해볼까?'}</p>
        <button type="button" onClick={() => nav('/profile/build/categories', { viewTransition: true })} className="btn-primary mt-6 w-full">
          시작하기
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
