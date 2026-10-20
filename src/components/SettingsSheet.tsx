import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllData } from '../lib/db';
import { enableNotifications, notificationState, showLocalNotification, type NotifyState } from '../lib/push';
import { getThemePref, setThemePref, type ThemePref } from '../lib/theme';
import { useAppStore } from '../store';
import { Icon, type IconName } from './Icon';
import { Sheet } from './ui';

const THEMES: { value: ThemePref; label: string; icon: IconName }[] = [
  { value: 'system', label: '시스템', icon: 'monitor' },
  { value: 'light', label: '밝게', icon: 'sun' },
  { value: 'dark', label: '어둡게', icon: 'moon' },
];
const NOTIFY_LABEL: Record<NotifyState, string> = { granted: '켜짐', denied: '브라우저에서 차단됨', default: '꺼짐', unsupported: '이 브라우저는 지원하지 않아요' };

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const mode = useAppStore((s) => s.mode);
  const credits = useAppStore((s) => s.credits);
  const [theme, setTheme] = useState<ThemePref>(getThemePref);
  const [notify, setNotify] = useState<NotifyState>(notificationState);

  const pick = (t: ThemePref) => {
    setTheme(t);
    setThemePref(t);
  };
  const turnOn = async () => {
    const state = await enableNotifications();
    setNotify(state);
    showToast(state === 'granted' ? '알림을 켰어요' : NOTIFY_LABEL[state]);
  };
  const test = async () => {
    try {
      await showLocalNotification('쿠키', '앱을 열면 쿠키가 먼저 말해요.');
    } catch {
      showToast('알림을 보낼 수 없어요');
    }
  };
  const reset = async () => {
    if (!window.confirm('프로필, 경험 카드, 지원 건, 면접 기록을 모두 지웁니다. 계속할까요?')) return;
    await clearAllData();
    try {
      ['khu-key-state', 'khu-onboarded', 'khu-mock-setup'].forEach((k) => localStorage.removeItem(k));
    } catch {
      // 무시
    }
    onClose();
    showToast('처음 상태로 돌렸어요');
    nav('/welcome', { replace: true });
    window.setTimeout(() => window.location.reload(), 300);
  };

  return (
    <Sheet open={open} onClose={onClose} title="설정">
      <section>
        <h3 className="label">화면 테마</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button key={t.value} type="button" aria-pressed={theme === t.value} onClick={() => pick(t.value)} className={`press flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-tile border text-small ${theme === t.value ? 'border-primary bg-lavender text-primary' : 'border-line bg-surface text-muted'}`}>
              <Icon name={t.icon} size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </section>
      <section className="mt-5">
        <h3 className="label">알림</h3>
        <div className="flex items-center justify-between rounded-tile border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-body text-ink">마감 전 알림</p>
            <p className="text-caption text-muted">{NOTIFY_LABEL[notify]}</p>
          </div>
          {notify === 'granted' ? (
            <button type="button" onClick={() => void test()} className="btn-secondary min-h-[36px] px-3 text-small">
              테스트
            </button>
          ) : (
            <button type="button" onClick={() => void turnOn()} disabled={notify === 'unsupported' || notify === 'denied'} className="btn-primary min-h-[36px] px-3 text-small">
              켜기
            </button>
          )}
        </div>
        <p className="mt-1.5 text-caption text-muted">서버 발송은 VAPID 키를 넣으면 켜져요. 지금은 이 기기 알림만 됩니다.</p>
      </section>
      <section className="mt-5">
        <h3 className="label">연결 상태</h3>
        <p className="text-small text-muted">{mode === 'live' ? `ChatKHU 연결됨 · 누적 크레딧 ${credits.toFixed(1)}` : '체험 모드 · 키를 넣으면 실제 대화로 바뀌어요'}</p>
      </section>
      <section className="mt-5">
        <button type="button" onClick={() => void reset()} className="btn-ghost w-full text-danger">
          <Icon name="trash" size={16} />
          데이터 모두 지우고 처음부터
        </button>
      </section>
    </Sheet>
  );
}
