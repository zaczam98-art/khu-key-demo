import { useEffect, useState } from 'react';
import { Character } from './Character';

// 첫 그리기 뒤 짧게 보이는 스플래시. 한 세션에 한 번만 보입니다.
export function Splash() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('khu-splash');
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem('khu-splash', '1');
    } catch {
      // 무시
    }
    const t = window.setTimeout(() => setShow(false), 900);
    return () => window.clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-lavender" aria-hidden="true">
      <Character expr="default" size={140} className="pop" />
      <p className="rise mt-4 text-title text-primary" style={{ animationDelay: '150ms' }}>
        쿠키
      </p>
      <p className="rise mt-1 text-small text-muted" style={{ animationDelay: '250ms' }}>
        먼저 질문하는 AI 커리어 메이트
      </p>
    </div>
  );
}
