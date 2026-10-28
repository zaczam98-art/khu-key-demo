import { describe, expect, it } from 'vitest';
import { exploreMentions } from './build';

describe('exploreMentions', () => {
  const turns = [
    { role: 'assistant', content: '어떤 활동을 할 때 몰입했어?' },
    { role: 'user', content: '학생회에서 축제 기획을 맡았을 때 시간 가는 줄 몰랐어!' },
    { role: 'user', content: '카페 알바도 했었어' },
    { role: 'user', content: '응' },
  ];
  it('분류와 관련된 사용자 문장만 고른다', () => {
    expect(exploreMentions(turns, '학생회')).toEqual(['학생회에서 축제 기획을 맡았을 때 시간 가는 줄 몰랐어!']);
    expect(exploreMentions(turns, '아르바이트')).toEqual(['카페 알바도 했었어']);
    expect(exploreMentions(turns, '봉사')).toEqual([]);
  });
  it('루다의 말과 너무 짧은 답은 빼고, 긴 문장은 90자에서 자른다', () => {
    const long = [{ role: 'user', content: '동아리 '.repeat(40) }];
    expect(exploreMentions(long, '동아리')[0].length).toBe(91);
    expect(exploreMentions([{ role: 'user', content: '학생회' }], '학생회')).toEqual([]);
  });
});
