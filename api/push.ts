// 웹 푸시 구독 저장과 테스트 발송. VAPID 키가 없으면 구독만 받아 두고 발송은 체험 모드로 돌려줍니다.
//   POST /api/push { subscription }            구독 저장
//   POST /api/push { send: true, title, body } (x-push-secret 헤더) 저장된 구독 전부에 발송
import webpush from 'web-push';
import { json } from '../server/lib/http';

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };
const mem = new Map<string, Sub>();

async function kv(command: unknown[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(command) });
  return ((await r.json()) as { result?: unknown }).result ?? null;
}

async function save(sub: Sub): Promise<void> {
  if ((await kv(['HSET', 'push:subs', sub.endpoint, JSON.stringify(sub)])) === null) mem.set(sub.endpoint, sub);
}
async function all(): Promise<Sub[]> {
  const fromKv = (await kv(['HVALS', 'push:subs'])) as string[] | null;
  if (fromKv) return fromKv.map((s) => JSON.parse(s) as Sub);
  return [...mem.values()];
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { subscription?: Sub; send?: boolean; title?: string; body?: string } | null;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (body?.subscription?.endpoint) {
    await save(body.subscription);
    return json({ ok: true, demo: !publicKey });
  }
  if (body?.send) {
    if (req.headers.get('x-push-secret') !== (process.env.PUSH_SECRET || '')) return json({ error: 'forbidden' }, 403);
    if (!publicKey || !privateKey) return json({ sent: 0, demo: true, reason: 'VAPID 키가 없어요' });
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', publicKey, privateKey);
    const payload = JSON.stringify({ title: body.title ?? '쿠키', body: body.body ?? '앱을 열면 쿠키가 먼저 말해요.' });
    const subs = await all();
    const results = await Promise.allSettled(subs.map((s) => webpush.sendNotification(s, payload)));
    return json({ sent: results.filter((r) => r.status === 'fulfilled').length, total: subs.length, demo: false });
  }
  return json({ error: 'subscription or send required' }, 400);
}
