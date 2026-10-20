// 자소서 문항에 쓸 경험 카드 추천. 공고 키워드·문항 문구와 카드의 역량·활동이 겹치는 정도로 순서를 정합니다. (design/03_자소서.png 3·6번)
import type { Application, EssayQuestion, Experience } from './db';

const tokens = (s: string) => s.toLowerCase().split(/[\s,./·()#]+/).filter((t) => t.length >= 2);

export function rankExperiences(cards: Experience[], app: Pick<Application, 'keywords' | 'job'>, question: Pick<EssayQuestion, 'text'>): { card: Experience; score: number }[] {
  const wanted = new Set([...app.keywords.flatMap(tokens), ...tokens(app.job), ...tokens(question.text)]);
  return cards
    .map((card) => {
      const have = [...card.skills, ...card.activities, ...card.achievements, card.title, card.role].flatMap(tokens);
      let score = 0;
      for (const t of have) for (const w of wanted) if (t.includes(w) || w.includes(t)) score += 1;
      if (card.achievements.some((a) => /\d/.test(a))) score += 1; // 숫자 성과가 있으면 가산
      return { card, score };
    })
    .sort((a, b) => b.score - a.score || b.card.createdAt.localeCompare(a.card.createdAt));
}

// 본문에서 공고 키워드를 강조 표시하기 위해 조각으로 나눕니다.
export function splitByKeywords(body: string, keywords: string[]): { text: string; hit: boolean }[] {
  const words = keywords.flatMap((k) => k.split(/[/·]/)).map((k) => k.trim()).filter((k) => k.length >= 2);
  if (!words.length) return [{ text: body, hit: false }];
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return body
    .split(re)
    .filter((s) => s.length)
    .map((s) => ({ text: s, hit: words.includes(s) }));
}

export const missingKeywords = (body: string, keywords: string[]): string[] => keywords.filter((k) => !k.split(/[/·]/).some((w) => w.trim() && body.includes(w.trim())));

export const questionTitle = (text: string): string => text.replace(/를 기술해주세요\.?|을 기술해주세요\.?|을 작성해 주세요\.?|를 작성해 주세요\.?|해 주세요\.?|주세요\.?$/g, '').slice(0, 24);
