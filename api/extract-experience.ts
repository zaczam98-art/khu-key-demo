// POST /api/extract-experience  { messages, category? } -> { result: ExperienceCard, credits?, demo }
import { completeJson, type Msg } from '../server/lib/chatkhu';
import { json } from '../server/lib/http';
import { EXPERIENCE_EXTRACT_SYSTEM } from '../server/prompts/experience-extract';
import { interviewScript } from '../src/lib/demoScript';
import { ExperienceCardSchema, experienceCardJsonSchema, type ExperienceCard } from '../src/lib/schema';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { messages?: Msg[]; category?: string } | null;
  const messages = (body?.messages ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
  if (!messages.length) return json({ error: 'messages required' }, 400);
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const transcript =
    (body?.category ? `[사용자가 고른 분류] ${body.category}\n` : '') + messages.map((m) => `${m.role === 'user' ? '사용자' : '루다'}: ${m.content}`).join('\n');
  try {
    const r = await completeJson<ExperienceCard>(
      EXPERIENCE_EXTRACT_SYSTEM,
      [{ role: 'user', content: transcript }],
      experienceCardJsonSchema,
      'experience_card',
      anon,
      (data) => ExperienceCardSchema.parse(data),
      ExperienceCardSchema.parse(interviewScript(body?.category).result),
    );
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '카드 정리에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
