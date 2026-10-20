import { describe, expect, it } from 'vitest';
import { daysUntil, ddayLabel, sortTasks, taskPriority } from './dday';

const now = new Date(2026, 9, 20, 15, 0, 0); // 2026-10-20 15:00

describe('dday', () => {
  it('오늘은 D-DAY, 3일 뒤는 D-3, 지난 날은 D+', () => {
    expect(ddayLabel(new Date(2026, 9, 20, 9).toISOString(), now)).toBe('D-DAY');
    expect(ddayLabel(new Date(2026, 9, 23, 23).toISOString(), now)).toBe('D-3');
    expect(ddayLabel(new Date(2026, 9, 18).toISOString(), now)).toBe('D+2');
    expect(ddayLabel(undefined, now)).toBe('마감 미정');
  });
  it('시간이 달라도 날짜 차이만 센다', () => {
    expect(daysUntil(new Date(2026, 9, 21, 0, 30).toISOString(), now)).toBe(1);
  });
  it('서류 제출이 같은 날 다른 일보다 앞에 온다', () => {
    const due = new Date(2026, 9, 22).toISOString();
    const tasks = [
      { id: 'a', type: '기타' as const, dueAt: due, done: false },
      { id: 'b', type: '서류제출' as const, dueAt: due, done: false },
      { id: 'c', type: '자소서' as const, dueAt: new Date(2026, 9, 21).toISOString(), done: false },
      { id: 'd', type: '서류제출' as const, dueAt: new Date(2026, 9, 19).toISOString(), done: true },
    ];
    expect(sortTasks(tasks, now).map((t) => t.id)).toEqual(['c', 'b', 'a', 'd']);
    expect(taskPriority(tasks[3], now)).toBeGreaterThan(taskPriority(tasks[0], now));
  });
});
