import { describe, expect, it } from 'vitest';
import { splitEvents } from './events';

describe('splitEvents', () => {
  it('이벤트 태그를 떼어 내고 본문만 남긴다', () => {
    const { text, events } = splitEvents('고마워! 정리해 볼게 ✨\n<<EVENT:{"type":"analyze"}>>');
    expect(text).toBe('고마워! 정리해 볼게 ✨');
    expect(events).toEqual([{ type: 'analyze' }]);
  });
  it('태그가 없으면 그대로 돌려준다', () => {
    expect(splitEvents('안녕!')).toEqual({ text: '안녕!', events: [] });
  });
  it('깨진 태그는 무시한다', () => {
    expect(splitEvents('본문 <<EVENT:{bad}>>').events).toEqual([]);
  });
});
