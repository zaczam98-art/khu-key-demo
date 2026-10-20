import { describe, expect, it } from 'vitest';
import { greetingByHour } from './greeting';

describe('greetingByHour', () => {
  it('시각대별로 다른 인사를 돌려준다', () => {
    expect(greetingByHour(3)).toContain('밤');
    expect(greetingByHour(9)).toContain('아침');
    expect(greetingByHour(15)).toContain('오후');
    expect(greetingByHour(21)).toContain('수고');
  });
});
