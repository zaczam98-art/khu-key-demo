import { describe, expect, it } from 'vitest';
import { mask } from './mask';

describe('mask', () => {
  it('이메일, 전화번호, 학번을 지운다', () => {
    expect(mask('연락처는 010-1234-5678 이고 메일은 me@khu.ac.kr, 학번 2021104567 이야')).toBe(
      '연락처는 [전화번호] 이고 메일은 [이메일], 학번 [학번] 이야',
    );
  });
  it('일반 문장은 그대로 둔다', () => {
    expect(mask('동아리에서 2023년에 행사 기획을 맡았어')).toBe('동아리에서 2023년에 행사 기획을 맡았어');
  });
});
