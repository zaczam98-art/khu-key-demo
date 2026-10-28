import { describe, expect, it } from 'vitest';
import { parseJsonLoosely } from './chatkhu';

describe('parseJsonLoosely', () => {
  it('정상 JSON 은 그대로 파싱한다', () => {
    expect(parseJsonLoosely('{"a":"b\\nc","n":1}')).toEqual({ a: 'b\nc', n: 1 });
  });
  it('문자열 안의 날 줄바꿈과 탭을 고친다 (자소서 초안 실패 사례)', () => {
    const raw = '{"body":"첫 문단입니다.\n\n둘째 문단입니다.\t끝","feedback":"좋아","points":[],"examples":[]}';
    expect(parseJsonLoosely(raw)).toEqual({ body: '첫 문단입니다.\n\n둘째 문단입니다.\t끝', feedback: '좋아', points: [], examples: [] });
  });
  it('코드 펜스와 앞뒤 설명 문장을 떼어 낸다', () => {
    expect(parseJsonLoosely('다음은 결과입니다.\n```json\n{"a":1}\n```\n끝')).toEqual({ a: 1 });
  });
});
