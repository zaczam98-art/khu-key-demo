// POST /api/extract  { messages } -> { result: {keywords, traits, jobs}, credits?, demo }
import { completeJson, demoData, type Msg } from '../server/lib/chatkhu';
import { json } from '../server/lib/http';
import { EXPLORE_EXTRACT_SYSTEM } from '../server/prompts/explore-extract';
import { ExploreResultSchema, exploreResultJsonSchema, type ExploreResult } from '../src/lib/schema';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { messages?: Msg[] } | null;
  const messages = (body?.messages ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
  if (!messages.length) return json({ error: 'messages required' }, 400);
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const transcript = messages.map((m) => `${m.role === 'user' ? '사용자' : '루다'}: ${m.content}`).join('\n');
  try {
    const r = await completeJson<ExploreResult>(
      EXPLORE_EXTRACT_SYSTEM,
      [{ role: 'user', content: transcript }],
      exploreResultJsonSchema,
      'explore_result',
      anon,
      (data) => ExploreResultSchema.parse(data),
      ExploreResultSchema.parse(demoData.explore),
    );
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '분석에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
