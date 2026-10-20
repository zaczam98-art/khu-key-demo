import { describe, expect, it } from 'vitest';
import { findJob, JOBS } from './jobs';

describe('직무 사전', () => {
  it('30개이고 이름이 겹치지 않는다', () => {
    expect(JOBS).toHaveLength(30);
    expect(new Set(JOBS.map((j) => j.name)).size).toBe(30);
  });
  it('항목마다 주요 업무 4개, 잘 맞는 사람 2개, 태그 3~4개가 있다', () => {
    for (const job of JOBS) {
      expect(job.duties, job.name).toHaveLength(4);
      expect(job.fits, job.name).toHaveLength(2);
      expect(job.tags.length, job.name).toBeGreaterThanOrEqual(3);
      expect(job.tags.length, job.name).toBeLessThanOrEqual(4);
      expect(job.summary.endsWith('직무예요.'), job.name).toBe(true);
    }
  });
  it('관련 직무 이름은 모두 사전에 있다', () => {
    const names = new Set(JOBS.map((j) => j.name));
    for (const job of JOBS) for (const r of job.related) expect(names.has(r), `${job.name} -> ${r}`).toBe(true);
  });
  it('일부만 적힌 이름도 찾는다', () => {
    expect(findJob('마케팅 기획자')?.name).toBe('마케팅 기획자');
    expect(findJob('마케팅 기획')?.name).toBe('마케팅 기획자');
    expect(findJob('없는 직무')).toBeUndefined();
  });
});
