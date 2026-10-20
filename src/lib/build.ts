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
export const hasNext = (s: BuildState): boolean => s.index + 1 < s.categories.length;

// 분류 격자의 설명 (시안 2번)
export const CATEGORY_HINT: Record<ExperienceCategory, string> = {
  동아리: '학술/친목 등',
  학회: '전공/연합 등',
  학생회: '과/단과대/총학생회 등',
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
