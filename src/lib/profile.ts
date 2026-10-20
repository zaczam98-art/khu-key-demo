import type { JobEntry } from '../data/jobs';
import { db, type Profile, type TargetJob } from './db';
import type { ExploreResult } from './schema';

const CONFIDENCE: TargetJob['confidence'][] = ['상', '중', '하'];

async function current(): Promise<Profile> {
  const now = new Date().toISOString();
  return (
    (await db.profile.get('me')) ?? {
      id: 'me' as const,
      targetJobs: [],
      strengths: [],
      exploreKeywords: [],
      createdAt: now,
      updatedAt: now,
    }
  );
}

function mergeJobs(existing: TargetJob[], incoming: TargetJob[]): TargetJob[] {
  return [...existing.filter((t) => !incoming.some((i) => i.name === t.name)), ...incoming];
}

// 탐색 결과를 Profile.targetJobs(source: explore) 에 저장하고 키워드·강점을 갱신합니다. (CLAUDE.md 12절 10번)
export async function saveExploreResult(result: ExploreResult, onlyIndex?: number): Promise<Profile> {
  const profile = await current();
  const picked = onlyIndex === undefined ? result.jobs : result.jobs.filter((_, i) => i === onlyIndex);
  const incoming: TargetJob[] = picked.map((job) => ({
    name: job.name,
    source: 'explore',
    confidence: CONFIDENCE[Math.min(result.jobs.indexOf(job), 2)],
    reason: job.why,
  }));
  const next: Profile = {
    ...profile,
    targetJobs: mergeJobs(profile.targetJobs, incoming),
    strengths: result.traits,
    exploreKeywords: result.keywords,
    updatedAt: new Date().toISOString(),
  };
  await db.profile.put(next);
  return next;
}

// 직무 사전에서 고른 관련 직무를 관심 직무(source: manual)로 저장합니다.
export async function saveDictionaryJob(entry: JobEntry): Promise<Profile> {
  const profile = await current();
  const incoming: TargetJob = { name: entry.name, source: 'manual', confidence: '중', reason: `관련 직무에서 직접 골랐어. ${entry.summary}` };
  const next: Profile = { ...profile, targetJobs: mergeJobs(profile.targetJobs, [incoming]), updatedAt: new Date().toISOString() };
  await db.profile.put(next);
  return next;
}
