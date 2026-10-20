import { describe, expect, it } from 'vitest';
import type { Experience } from './db';
import { periodLabel, topSkills } from './experience';

const card = (skills: string[]): Experience => ({
  id: skills.join(), title: 't', category: '기타', period: { from: '', to: '' }, role: '', activities: [], achievements: [], learned: [], skills, sourceTurns: [], missing: [], confirmed: true, createdAt: '',
});

describe('experience', () => {
  it('역량 빈도를 많은 순으로 센다', () => {
    expect(topSkills([card(['기획', '조율']), card(['기획', '분석']), card(['기획'])], 2)).toEqual([
      { skill: '기획', count: 3 },
      { skill: '분석', count: 1 },
    ]);
  });
  it('기간 표시', () => {
    expect(periodLabel({ from: '2025-03', to: '' })).toBe('2025-03 ~ 진행 중');
    expect(periodLabel({ from: '', to: '' })).toBe('기간 미정');
  });
});
