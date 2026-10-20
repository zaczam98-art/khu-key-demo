import type { Experience } from './db';

// 경험 카드에서 역량 빈도를 셉니다. 종합 분석의 첫 버전은 LLM 없이 코드로 만듭니다.
export function topSkills(cards: Experience[], limit = 6): { skill: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const card of cards) for (const s of card.skills) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

export const periodLabel = (p: { from: string; to: string }): string => (p.from || p.to ? `${p.from || '?'} ~ ${p.to || '진행 중'}` : '기간 미정');

export function cardSummary(e: Experience): Pick<Experience, 'title' | 'role' | 'activities' | 'achievements' | 'learned' | 'skills'> {
  return { title: e.title, role: e.role, activities: e.activities, achievements: e.achievements, learned: e.learned, skills: e.skills };
}
