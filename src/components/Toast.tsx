import { useAppStore } from '../store';

// 화면 공통 토스트. useAppStore().showToast('...') 로 띄웁니다.
export function Toast() {
  const toast = useAppStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div role="status" className="toast pop">
      {toast}
    </div>
  );
}
