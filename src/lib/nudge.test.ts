import { describe, expect, it } from 'vitest';
import type { Application } from './db';
import { buildNudge, vocative } from './nudge';

const now = new Date(2026, 9, 20, 10);
const app = (over: Partial<Application>): Application => ({
  id: 'a1',
  company: '쿠키컴퍼니',
  job: '마케팅 기획자',
  keywords: [],
  stage: '작성중',
  questions: [{ qid: 'q1', text: '지원 동기', limit: 500, expIds: [], status: '미작성', versions: [] }],
  checklist: [],
  ...over,
});

describe('vocative', () => {
  it('받침에 따라 아/야를 붙인다', () => {
    expect(vocative('형각')).toBe('형각아');
    expect(vocative('지수')).toBe('지수야');
    expect(vocative('Amy')).toBe('Amy야');
  });
});

describe('buildNudge', () => {
  it('마감 3일 이내 지원 건이 가장 먼저다', () => {
    const n = buildNudge({ applications: [app({ deadline: new Date(2026, 9, 22).toISOString() })], experiences: [], tasks: [], sessions: [], now });
    expect(n.text).toContain('2일 뒤');
    expect(n.cta?.to).toBe('/essay/a1');
  });
  it('직무가 없으면 직무 탐색을 권한다', () => {
    const n = buildNudge({ profile: null, applications: [], experiences: [], tasks: [], sessions: [], now });
    expect(n.cta?.to).toBe('/explore');
  });
  it('닉네임이 있으면 이름을 부른다', () => {
    const n = buildNudge({
      profile: { id: 'me', nickname: '지수', targetJobs: [{ name: 'x', source: 'manual', confidence: '중', reason: '' }], strengths: [], exploreKeywords: [], createdAt: '', updatedAt: '' },
      applications: [],
      experiences: [],
      tasks: [],
      sessions: [],
      now,
    });
    expect(n.text).toContain('지수야');
  });
});
