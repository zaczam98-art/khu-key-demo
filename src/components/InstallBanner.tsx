import { usePwaInstall } from '../lib/hooks';
import { Icon } from './Icon';

// 홈 화면 추가 안내. 설치 가능한 브라우저에서만 보입니다.
export function InstallBanner() {
  const { canInstall, install } = usePwaInstall();
  if (!canInstall) return null;
  return (
    <div className="rise mt-4 flex items-center gap-3 rounded-card bg-ink px-4 py-3 text-surface">
      <Icon name="install" size={22} className="shrink-0 text-lavender" />
      <p className="flex-1 text-small leading-snug">홈 화면에 추가하면 앱처럼 바로 열려요.</p>
      <button type="button" onClick={() => void install()} className="press min-h-[36px] rounded-full bg-primary px-3 text-small font-semibold text-white">
        추가
      </button>
    </div>
  );
}
