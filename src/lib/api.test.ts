import { afterEach, describe, expect, it, vi } from 'vitest';
import { extract } from './api';

const stubFetch = (status: number) =>
  vi.stubGlobal('fetch', async () => ({ ok: status < 400, status, json: async () => ({}) }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('extract', () => {
  it('서버가 없어 405가 와도 체험 모드로 돌아간다 (GitHub Pages)', async () => {
    stubFetch(405);
    await expect(extract([{ role: 'user', content: '테스트' }])).resolves.toMatchObject({ demo: true });
  }, 10000);
  it('서버가 502를 주면 다시 시도 안내로 실패한다', async () => {
    stubFetch(502);
    await expect(extract([{ role: 'user', content: '테스트' }])).rejects.toThrow('다시 시도');
  });
});
