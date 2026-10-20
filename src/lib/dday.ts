// 날짜 계산·D-day·우선순위는 LLM이 아니라 코드가 합니다. (CLAUDE.md 9절)
import type { Task } from './db';

const DAY = 86_400_000;
const startOfDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

export function daysUntil(dateIso: string, now = new Date()): number {
  return Math.round((startOfDay(new Date(dateIso)) - startOfDay(now)) / DAY);
}

export function ddayLabel(dateIso?: string, now = new Date()): string {
  if (!dateIso) return '마감 미정';
  const n = daysUntil(dateIso, now);
  if (n === 0) return 'D-DAY';
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
export function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;
}

// 숫자가 작을수록 급합니다. 서류 제출이 가장 무겁고, 같은 종류면 마감이 가까운 순서입니다.
const WEIGHT: Record<Task['type'], number> = { 서류제출: 0, 자소서: 1, 면접: 1, 인적성: 2, 기타: 3 };
export function taskPriority(task: Pick<Task, 'dueAt' | 'type' | 'done'>, now = new Date()): number {
  if (task.done) return 1_000_000;
  const days = daysUntil(task.dueAt, now);
  return days * 10 + WEIGHT[task.type];
}

export function sortTasks<T extends Pick<Task, 'dueAt' | 'type' | 'done'>>(tasks: T[], now = new Date()): T[] {
  return [...tasks].sort((a, b) => taskPriority(a, now) - taskPriority(b, now));
}

// <input type="date"> 값(YYYY-MM-DD)을 그 날 정오의 ISO 문자열로 바꿉니다. 시간대 때문에 하루가 밀리는 것을 막습니다.
export function dateInputToIso(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}
export function isoToDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
