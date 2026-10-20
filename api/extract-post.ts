// POST /api/extract-post  { text } -> { result: {keywords, values, deadline, questions}, credits?, demo }
import { completeJson, demoData } from '../server/lib/chatkhu';
import { json } from '../server/lib/http';
import { POST_EXTRACT_SYSTEM } from '../server/prompts/post-extract';
import { PostExtractSchema, postExtractJsonSchema, type PostExtract } from '../src/lib/schema';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? '').trim().slice(0, 12_000);
  if (!text) return json({ error: 'text required' }, 400);
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  try {
    const r = await completeJson<PostExtract>(
      POST_EXTRACT_SYSTEM,
      [{ role: 'user', content: text }],
      postExtractJsonSchema,
      'post_extract',
      anon,
      (data) => PostExtractSchema.parse(data),
      PostExtractSchema.parse({ keywords: demoData.post.keywords, values: demoData.post.values, deadline: demoData.post.deadline, questions: demoData.post.questions }),
    );
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '공고 분석에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
