// POST /api/essay-draft  { mode: 'draft'|'feedback'|'revise', company, job, keywords, values, question, limit, experiences, body?, points? }
//   -> { result: {body, feedback, points, examples}, credits?, demo }
import { completeJson, demoData } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';
import { ESSAY_DRAFT_SYSTEM, ESSAY_FEEDBACK_SYSTEM, ESSAY_REVISE_SYSTEM } from '../server/prompts/essay-draft.js';
import { EssayDraftSchema, essayDraftJsonSchema, type EssayDraft } from '../src/lib/schema.js';

type Body = {
  mode?: 'draft' | 'feedback' | 'revise';
  company?: string;
  job?: string;
  keywords?: string[];
  values?: string;
  question?: string;
  limit?: number;
  experiences?: { title: string; role: string; activities: string[]; achievements: string[]; learned: string[]; skills: string[] }[];
  body?: string;
  points?: string[];
};

const SYSTEM = { draft: ESSAY_DRAFT_SYSTEM, feedback: ESSAY_FEEDBACK_SYSTEM, revise: ESSAY_REVISE_SYSTEM } as const;

export async function POST(req: Request): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b?.question) return json({ error: 'question required' }, 400);
  const mode = b.mode === 'feedback' || b.mode === 'revise' ? b.mode : 'draft';
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const cards = (b.experiences ?? [])
    .map((e, i) => `카드 ${i + 1}: ${e.title}\n역할: ${e.role}\n한 일: ${e.activities.join(' / ')}\n성과: ${e.achievements.join(' / ') || '없음'}\n배운 점: ${e.learned.join(' / ') || '없음'}\n역량: ${e.skills.join(', ')}`)
    .join('\n\n');
  const content = [
    `mode: ${mode}`,
    `회사/직무: ${b.company ?? ''} / ${b.job ?? ''}`,
    `공고 키워드: ${(b.keywords ?? []).join(', ') || '없음'}`,
    `회사 가치관: ${b.values || '없음'}`,
    `문항: ${b.question}`,
    `글자 수 제한: ${b.limit ?? 500}자`,
    mode === 'draft' ? `경험 카드:\n${cards || '없음'}` : `사용자가 쓴 글:\n${b.body ?? ''}`,
    mode === 'revise' && b.points?.length ? `반영할 첨삭 포인트:\n${b.points.map((p) => `- ${p}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const demo: EssayDraft =
    mode === 'draft' ? demoData.draft : mode === 'revise' ? demoData.revise : { body: b.body ?? '', ...demoData.feedback };
  try {
    // 초안·전체 수정은 본문 700자 안팎을 새로 쓰므로 빠른 모델을 씁니다(Sonnet 은 40초를 넘겨 게이트웨이가 생성을 끊었음). 첨삭은 출력이 짧아 기본 모델입니다.
    const model = mode === 'feedback' ? undefined : process.env.CHATKHU_ESSAY_MODEL || 'claude-haiku-5-5';
    const r = await completeJson<EssayDraft>(SYSTEM[mode], [{ role: 'user', content }], essayDraftJsonSchema, 'essay_draft', anon, (data) => EssayDraftSchema.parse(data), EssayDraftSchema.parse(demo), { model, maxTokens: 2500 });
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '자소서 작업에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
