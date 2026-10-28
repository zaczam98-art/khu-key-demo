// 프로필 구축 마법사의 진행 상태 (design/02_프로필구축.png). 고른 분류 목록과 지금 몇 번째인지를 기억합니다.
import type { ExperienceCategory } from './db';

export type BuildState = { categories: ExperienceCategory[]; index: number };
const KEY = 'khu-build';

export function getBuild(): BuildState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as BuildState;
  } catch {
    // 무시
  }
  return { categories: [], index: 0 };
}
export function setBuild(state: BuildState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 무시
  }
}
export const currentCategory = (s: BuildState): ExperienceCategory | undefined => s.categories[s.index];

// 직무 탐색 대화에서 사용자가 이미 말한 문장 중 이 분류와 관련된 것. 경험 인터뷰에서 같은 이야기를 다시 시키지 않으려고
// 첫 말풍선에 인용하고 서버로 보내는 화면 문맥에도 붙입니다. (팀 피드백 2026-10-28)
const CATEGORY_WORDS: Record<ExperienceCategory, string[]> = {
  동아리: ['동아리', '소모임', '밴드', '학회 활동'],
  학회: ['학회', '스터디', '세미나'],
  학생회: ['학생회', '총학', '과대', '학과 행사', '집행부'],
  봉사: ['봉사', '멘토링', '튜터링'],
  아르바이트: ['아르바이트', '알바', '카페', '편의점', '과외', '매장'],
  인턴십: ['인턴', '현장실습', '대외활동', '서포터즈'],
  공모전: ['공모전', '대회', '해커톤', '수상', '프로젝트'],
  '자격증·교육': ['자격증', '교육', '수료', '부트캠프', '강의', '토익', '어학'],
  기타: [],
};
export function exploreMentions(turns: { role: string; content: string }[], category: ExperienceCategory): string[] {
  const words = CATEGORY_WORDS[category];
  if (!words.length) return [];
  return turns
    .filter((t) => t.role === 'user' && words.some((w) => t.content.includes(w)))
    .map((t) => t.content.replace(/\s+/g, ' ').trim())
    .filter((c) => c.length >= 8)
    .slice(0, 2)
    .map((c) => (c.length > 90 ? `${c.slice(0, 90)}…` : c));
}
export const hasNext = (s: BuildState): boolean => s.index + 1 < s.categories.length;

// 분류 격자의 설명 (시안 2번)
export const CATEGORY_HINT: Record<ExperienceCategory, string> = {
  동아리: '학술/친목 등',
  학회: '전공/연합 등',
  학생회: '과/총학생회 등',
  봉사: '봉사활동',
  아르바이트: '매장/사무 등',
  인턴십: '대외활동 포함',
  공모전: '수상/참가',
  '자격증·교육': '자격증/교육',
  기타: '직접 입력',
};
// 미리보기 탭 묶음 (시안 8번: 전체 / 활동 / 아르바이트)
export const PREVIEW_GROUPS: { label: string; categories: ExperienceCategory[] }[] = [
  { label: '활동', categories: ['동아리', '학회', '학생회', '봉사', '공모전', '기타'] },
  { label: '아르바이트', categories: ['아르바이트', '인턴십'] },
  { label: '자격증·교육', categories: ['자격증·교육'] },
];
