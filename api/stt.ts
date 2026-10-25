// POST /api/stt  multipart { file: wav(16kHz mono), turn?: number } -> { text, demo }
// ChatKHU STT(/audio/transcriptions/)로 넘깁니다. 2026-10-25 실측: multipart file + model(stt-async-v5)로 보내면
// {operation_id, status:'processing', credits_charged} 가 오고, GET .../{operation_id}/ 가 {status:'completed', text, segments} 를 돌려줍니다(6.8초 음성이 2초 안에 완료).
// 키가 없으면 체험 대본의 n번째 답변을 "받아쓴 것처럼" 돌려줍니다.
import { apiKey, demoData, gatewayBase, overCap, record } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';

type Transcription = { text?: string; operation_id?: string; status?: string; credits_charged?: number; result?: { text?: string } };

async function transcribe(file: File): Promise<{ text: string; credits: number }> {
  const form = new FormData();
  form.append('file', file, 'answer.wav');
  form.append('model', process.env.CHATKHU_STT_MODEL || 'stt-async-v5');
  const headers = { authorization: `Bearer ${apiKey()}` };
  const r = await fetch(`${gatewayBase()}/audio/transcriptions/`, { method: 'POST', headers, body: form });
  if (!r.ok) throw new Error(`ChatKHU STT ${r.status}: ${(await r.text()).slice(0, 200)}`);
  let data = (await r.json()) as Transcription;
  const credits = typeof data.credits_charged === 'number' ? data.credits_charged : Math.max(0.1, file.size / 320_000);
  // 비동기 작업이면 operation_id 로 상태를 폴링합니다 (최대 30초. 7초 음성은 2초면 끝납니다).
  for (let i = 0; i < 15 && !data.text && data.operation_id; i++) {
    await new Promise((res) => setTimeout(res, 2000));
    const s = await fetch(`${gatewayBase()}/audio/transcriptions/${data.operation_id}/`, { headers });
    if (!s.ok) throw new Error(`ChatKHU STT status ${s.status}`);
    data = (await s.json()) as Transcription;
    if (data.result?.text) data.text = data.result.text;
    if (data.status === 'failed' || data.status === 'error') throw new Error('STT 작업이 실패했어요');
  }
  if (!data.text) throw new Error('STT 결과가 비어 있어요');
  return { text: data.text, credits };
}

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const turn = Number(form?.get('turn') ?? 0);
  if (!(file instanceof File) || file.size === 0) return json({ error: '녹음 파일이 없어요' }, 400);
  const demoText = demoData.answers[Math.min(Math.max(turn, 0), demoData.answers.length - 1)];
  if (!apiKey() || (await overCap())) return json({ text: demoText, demo: true });
  try {
    const { text, credits } = await transcribe(file);
    // 실측: 1초에 약 0.1 크레딧(credits_charged). 값이 없으면 16kHz wav 크기로 근사합니다.
    await record(credits, req.headers.get('x-anon-id') ?? 'anon');
    return json({ text, demo: false });
  } catch (e) {
    return json({ error: '받아쓰기에 실패했어요. 글로 답하거나 다시 녹음해 주세요.', detail: (e as Error).message }, 502);
  }
}
