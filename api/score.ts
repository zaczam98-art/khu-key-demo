// POST /api/score  { messages, type?, job?, company? } -> { result: {scores, evidence, summary, perQuestion}, credits?, demo }
import { completeJson, demoData, type Msg } from '../server/lib/chatkhu';
import { json } from '../server/lib/http';
import { SCORE_SYSTEM_PREFIX } from '../server/prompts/score-extract';
import { rubricText } from '../src/data/rubric';
import { ScoreSchema, scoreJsonSchema, type ScoreResult } from '../src/lib/schema';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { messages?: Msg[]; type?: string; job?: string; company?: string } | null;
  const messages = (body?.messages ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
  if (!messages.filter((m) => m.role === 'user').length) return json({ error: 'answers required' }, 400);
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const transcript =
    `[면접 유형] ${body?.type ?? '실무'}\n[지원 회사] ${body?.company ?? '미정'}\n[지원 직무] ${body?.job ?? '미정'}\n\n` +
    messages.map((m) => `${m.role === 'user' ? '지원자' : '면접관'}: ${m.content}`).join('\n');
  try {
    const r = await completeJson<ScoreResult>(
      SCORE_SYSTEM_PREFIX + rubricText(),
      [{ role: 'user', content: transcript }],
      scoreJsonSchema,
      'interview_score',
      anon,
      (data) => ScoreSchema.parse(data),
      ScoreSchema.parse(demoData.score),
    );
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '채점에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
