// 웹 푸시 수신. vite-plugin-pwa 가 만드는 서비스 워커가 importScripts 로 불러옵니다.
self.addEventListener('push', (event) => {
  let data = { title: '쿠키', body: '앱을 열면 쿠키가 먼저 말해요.' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // 본문이 JSON 이 아니면 기본 문구를 씁니다.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: data.url || './' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.startsWith(self.registration.scope));
      if (existing) return existing.focus().then((c) => c.navigate?.(url));
      return self.clients.openWindow(url);
    }),
  );
});
