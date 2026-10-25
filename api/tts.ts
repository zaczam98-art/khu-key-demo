// POST /api/tts  { text } -> audio/mpeg (ChatKHU /audio/speech/)  |  204 (키 없음: 브라우저 음성 합성으로 대체)
// 요청 본문은 OpenAI 호환({model, input, voice})으로 가정했고 실측 전입니다(docs/chatkhu-api.md). input 은 4,000자 제한.
import { apiKey, gatewayBase, overCap, record } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? '').trim().slice(0, 4000);
  if (!text) return json({ error: 'text required' }, 400);
  if (!apiKey() || (await overCap())) return new Response(null, { status: 204 });
  try {
    const r = await fetch(`${gatewayBase()}/audio/speech/`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.CHATKHU_TTS_MODEL || 'gemini-3.8-flash-tts', input: text, voice: process.env.CHATKHU_TTS_VOICE || 'alloy', response_format: 'mp3' }),
    });
    if (!r.ok) throw new Error(`ChatKHU TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await record(Math.max(0.05, text.length / 4000), req.headers.get('x-anon-id') ?? 'anon');
    return new Response(await r.arrayBuffer(), { status: 200, headers: { 'content-type': r.headers.get('content-type') || 'audio/mpeg', 'cache-control': 'no-store' } });
  } catch {
    return new Response(null, { status: 204 });
  }
}
