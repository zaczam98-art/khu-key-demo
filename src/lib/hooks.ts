import { useCallback, useEffect, useState } from 'react';

// 네트워크 상태. 대화 헤더의 "온라인" 표시에 씁니다.
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

// 홈 화면 추가(PWA 설치) 안내. 브라우저가 beforeinstallprompt 를 줄 때만 버튼을 보여 줍니다.
export function usePwaInstall(): { canInstall: boolean; install: () => Promise<void> } {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  );
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = async () => {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setEvent(null);
  };
  return { canInstall: !!event && !installed, install };
}

// Dexie 조회를 화면 상태로. reload() 를 부르면 다시 읽습니다.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    load().then((v) => {
      if (!alive) return;
      setData(v);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, reload };
}

// 현재 시각(1분마다 갱신). 데스크톱 폰 프레임의 상태바에 씁니다.
export function useClock(): string {
  const fmt = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const t = window.setInterval(() => setTime(fmt()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  return time;
}
