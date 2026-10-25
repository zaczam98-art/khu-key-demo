// POST /api/tts  { text } -> audio/wav (ChatKHU /audio/speech/)  |  204 (키 없음·오류: 브라우저 음성 합성으로 대체)
// 2026-10-25 실측: 게이트웨이는 response_format 과 무관하게 raw PCM(audio/pcm, 24kHz 16bit mono)을 돌려주고,
// voice 를 비우면 모델 기본 화자를 씁니다(voice 에 OpenAI 이름을 넣으면 400). 브라우저가 못 트는 raw PCM 이라 여기서 WAV 헤더를 붙입니다.
import { apiKey, gatewayBase, overCap, record } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';

const PCM_RATE = Number(process.env.CHATKHU_TTS_RATE || 24000);

function pcmToWav(pcm: ArrayBuffer, rate: number): ArrayBuffer {
  const out = new ArrayBuffer(44 + pcm.byteLength);
  const v = new DataView(out);
  const tag = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); v.setUint32(4, 36 + pcm.byteLength, true); tag(8, 'WAVE');
  tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  tag(36, 'data'); v.setUint32(40, pcm.byteLength, true);
  new Uint8Array(out, 44).set(new Uint8Array(pcm));
  return out;
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? '').trim().slice(0, 4000);
  if (!text) return json({ error: 'text required' }, 400);
  if (!apiKey() || (await overCap())) return new Response(null, { status: 204 });
  try {
    const voice = process.env.CHATKHU_TTS_VOICE;
    const r = await fetch(`${gatewayBase()}/audio/speech/`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.CHATKHU_TTS_MODEL || 'gemini-3.8-flash-tts', input: text, ...(voice ? { voice, language: 'ko' } : {}) }),
    });
    if (!r.ok) throw new Error(`ChatKHU TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await record(Math.max(0.05, text.length / 4000), req.headers.get('x-anon-id') ?? 'anon');
    const type = r.headers.get('content-type') || 'audio/pcm';
    const raw = await r.arrayBuffer();
    const isPcm = type.includes('pcm') || type.includes('octet-stream');
    return new Response(isPcm ? pcmToWav(raw, PCM_RATE) : raw, {
      status: 200,
      headers: { 'content-type': isPcm ? 'audio/wav' : type, 'cache-control': 'no-store' },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
