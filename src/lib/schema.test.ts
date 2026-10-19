import { describe, expect, it } from 'vitest';
import demo from '../../server/demo/explore.json';
import { ExploreResultSchema } from './schema';

describe('ExploreResultSchema', () => {
  it('체험 모드 대본의 결과는 스키마를 통과한다', () => {
    expect(ExploreResultSchema.safeParse(demo.result).success).toBe(true);
  });
  it('직무가 비어 있으면 실패한다', () => {
    expect(ExploreResultSchema.safeParse({ keywords: ['a', 'b', 'c'], traits: ['a', 'b'], jobs: [] }).success).toBe(false);
  });
});
