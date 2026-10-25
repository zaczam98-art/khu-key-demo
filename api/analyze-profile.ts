// POST /api/analyze-profile  { cards: [{title, category, role, activities, achievements, learned, skills}] } -> { result: {strengths, summary}, credits?, demo }
import { completeJson, demoData } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';
import { PROFILE_ANALYSIS_SYSTEM } from '../server/prompts/profile-analysis.js';
import { ProfileAnalysisSchema, profileAnalysisJsonSchema, type ProfileAnalysis } from '../src/lib/schema.js';

type Card = { title: string; category: string; role: string; activities: string[]; achievements: string[]; learned: string[]; skills: string[] };

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { cards?: Card[] } | null;
  const cards = body?.cards ?? [];
  if (!cards.length) return json({ error: 'cards required' }, 400);
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const content = cards
    .map((c, i) => `카드 ${i + 1} [${c.category}] ${c.title}\n역할: ${c.role}\n주요 활동: ${c.activities.join(' / ')}\n성과: ${c.achievements.join(' / ') || '없음'}\n배운 점: ${c.learned.join(' / ') || '없음'}\n역량: ${c.skills.join(', ')}`)
    .join('\n\n');
  try {
    const r = await completeJson<ProfileAnalysis>(
      PROFILE_ANALYSIS_SYSTEM,
      [{ role: 'user', content }],
      profileAnalysisJsonSchema,
      'profile_analysis',
      anon,
      (data) => ProfileAnalysisSchema.parse(data),
      ProfileAnalysisSchema.parse(demoData.analysis),
    );
    return json({ result: r.data, credits: r.credits, demo: r.demo });
  } catch (e) {
    return json({ error: '종합 분석에 실패했어요. 다시 시도해 주세요.', detail: (e as Error).message }, 502);
  }
}
