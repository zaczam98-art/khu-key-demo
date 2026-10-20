import { describe, expect, it } from 'vitest';
import type { Experience } from './db';
import { missingKeywords, rankExperiences, splitByKeywords } from './essay';

const card = (id: string, skills: string[], achievements: string[] = []): Experience => ({
  id, title: id, category: '기타', period: { from: '', to: '' }, role: '', activities: [], achievements, learned: [], skills, sourceTurns: [], missing: [], confirmed: true, createdAt: id,
});

describe('essay helpers', () => {
  it('공고 키워드와 겹치는 카드를 앞에 둔다', () => {
    const ranked = rankExperiences([card('a', ['고객 응대']), card('b', ['콘텐츠 기획', '데이터 분석'], ['조회수 2배'])], { keywords: ['콘텐츠 기획', '데이터 분석'], job: '콘텐츠 기획자' }, { text: '강점을 기술해주세요.' });
    expect(ranked[0].card.id).toBe('b');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
  it('키워드를 조각으로 나누고 빠진 키워드를 찾는다', () => {
    const parts = splitByKeywords('콘텐츠 기획을 좋아합니다.', ['콘텐츠 기획', '데이터 분석']);
    expect(parts.find((p) => p.hit)?.text).toBe('콘텐츠 기획');
    expect(missingKeywords('콘텐츠 기획을 좋아합니다.', ['콘텐츠 기획', '데이터 분석'])).toEqual(['데이터 분석']);
  });
});
