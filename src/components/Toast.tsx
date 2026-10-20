import { useAppStore } from '../store';

// 화면 공통 토스트. useAppStore().showToast('...') 로 띄웁니다.
export function Toast() {
  const toast = useAppStore((s) => s.toast);
  return (
    <div role="status" aria-live="polite">
      {toast && <div className="toast pop">{toast}</div>}
    </div>
  );
}
