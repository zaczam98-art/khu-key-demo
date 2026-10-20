// POST /api/essay-draft  { mode: 'draft'|'feedback', company, job, keywords, values, question, limit, experiences, body? }
//   -> { result: {body, feedback}, credits?, demo }
import { completeJson, demoData } from '../server/lib/chatkhu';
import { json } from '../server/lib/http';
import { ESSAY_DRAFT_SYSTEM, ESSAY_FEEDBACK_SYSTEM } from '../server/prompts/essay-draft';
import { EssayDraftSchema, essayDraftJsonSchema, type EssayDraft } from '../src/lib/schema';

type Body = {
  mode?: 'draft' | 'feedback';
  company?: string;
  job?: string;
  keywords?: string[];
  values?: string;
  question?: string;
  limit?: number;
  experiences?: { title: string; role: string; activities: string[]; achievements: string[]; learned: string[]; skills: string[] }[];
  body?: string;
};

export async function POST(req: Request): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b?.question) return json({ error: 'question required' }, 400);
  const mode = b.mode === 'feedback' ? 'feedback' : 'draft';
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const cards = (b.experiences ?? [])
    .map((e, i) => `카드 ${i + 1}: ${e.title}\n역할: ${e.role}\n한 일: ${e.activities.join(' / ')}\n성과: ${e.achievements.join(' / ') || '없음'}\n배운 점: ${e.learned.join(' / ') || '없음'}\n역량: ${e.skills.join(', ')}`)
    .join('\n\n');
  const content = [
    `회사/직무: ${b.company ?? ''} / ${b.job ?? ''}`,
    `공고 키워드: ${(b.keywords ?? []).join(', ') || '없음'}`,
    `회사 가치관: ${b.values || '없음'}`,
    `문항: ${b.question}`,
    `글자 수 제한: ${b.limit ?? 500}자`,
    mode === 'draft' ? `경험 카드:\n${cards || '없음'}` : `사용자가 쓴 글:\n${b.body ?? ''}`,
  ].join('\n\n');
  const demo: EssayDraft = mode === 'draft' ? demoData.draft : { body: b.body ?? '', feedback: demoData.feedback };
  try {
    const r = await completeJson<EssayDraft>(
      mode === 'draft' ? ESSAY_DRAFT_SYSTEM : ESSAY_FEEDBACK_SYSTEM,
      [{ role: 'user', content }],
      essayDraftJsonSchema,
      'essay_draft',
      anon,
      (data) => EssayDraftSchema.parse(data),
      EssayDraftSchema.parse(demo),
    );
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '초안 작성에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
