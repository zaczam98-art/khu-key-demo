import { db, type Profile, type TargetJob } from './db';
import type { ExploreResult } from './schema';

const CONFIDENCE: TargetJob['confidence'][] = ['상', '중', '하'];

// 탐색 결과를 Profile.targetJobs(source: explore) 에 저장하고 키워드·강점을 갱신합니다. (CLAUDE.md 12절 10번)
export async function saveExploreResult(result: ExploreResult, onlyIndex?: number): Promise<Profile> {
  const now = new Date().toISOString();
  const current = (await db.profile.get('me')) ?? {
    id: 'me' as const,
    targetJobs: [],
    strengths: [],
    exploreKeywords: [],
    createdAt: now,
    updatedAt: now,
  };
  const picked = onlyIndex === undefined ? result.jobs : result.jobs.filter((_, i) => i === onlyIndex);
  const incoming: TargetJob[] = picked.map((job) => ({
    name: job.name,
    source: 'explore',
    confidence: CONFIDENCE[Math.min(result.jobs.indexOf(job), 2)],
    reason: job.why,
  }));
  const next: Profile = {
    ...current,
    targetJobs: [...current.targetJobs.filter((t) => !incoming.some((i) => i.name === t.name)), ...incoming],
    strengths: result.traits,
    exploreKeywords: result.keywords,
    updatedAt: now,
  };
  await db.profile.put(next);
  return next;
}
