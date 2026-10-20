// 알림 켜기. 권한을 받고, VAPID 공개키(VITE_VAPID_PUBLIC_KEY)가 있으면 푸시 구독을 서버에 저장합니다.
// 키가 없으면 권한만 받고 로컬 알림 테스트까지만 됩니다. (서버 발송은 api/push.ts)
import { savePushSubscription } from './api';

export type NotifyState = 'granted' | 'denied' | 'default' | 'unsupported';

export function notificationState(): NotifyState {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission;
}

function toKey(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function enableNotifications(): Promise<NotifyState> {
  const state = notificationState();
  if (state === 'unsupported') return state;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (key) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) });
      await savePushSubscription(sub.toJSON());
    } catch {
      // 구독에 실패해도 로컬 알림은 됩니다.
    }
  }
  return 'granted';
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png`, badge: `${import.meta.env.BASE_URL}icons/icon-192.png` });
}
