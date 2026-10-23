import { describe, expect, it } from 'vitest';
import interviewDemo from '../../server/demo/interview.json';
import { CATEGORIES, ExperienceCardSchema } from './schema';
import { categoryFromHint, interviewScript } from './demoScript';

describe('경험 인터뷰 체험 대본', () => {
  it('화면 문맥에서 분류를 꺼낸다', () => {
    expect(categoryFromHint('사용자가 고른 경험 분류: 아르바이트 (2/3번째)')).toBe('아르바이트');
    expect(categoryFromHint('사용자가 고른 경험 분류: 자격증·교육 (1/1번째)')).toBe('자격증·교육');
    expect(categoryFromHint(undefined)).toBeUndefined();
  });

  it('분류마다 카드가 다르고 스키마를 통과한다', () => {
    const titles = new Set<string>();
    for (const category of CATEGORIES) {
      const script = interviewScript(category);
      const card = ExperienceCardSchema.parse(script.result);
      expect(card.category).toBe(category);
      expect(script.userScript).toHaveLength(3);
      expect(script.replies).toHaveLength(3);
      expect(script.replies[2][0]).toContain('card_ready');
      titles.add(card.title);
    }
    expect(titles.size).toBe(CATEGORIES.length);
  });

  it('모르는 분류는 기본 대본을 쓴다', () => {
    expect(interviewScript('없는분류').result).toBe(interviewDemo.result);
    expect(interviewScript(undefined).userScript).toBe(interviewDemo.userScript);
  });
});
