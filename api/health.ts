// GET /api/health -> { ok: true, live: boolean }
// 홈이 처음 열릴 때 서버와 ChatKHU 키가 있는지 확인해 "ChatKHU 연결됨 / 체험 모드" 배지를 대화 전에 맞춥니다.
// 키 값은 돌려주지 않고, 키 유무와 일일 상한만 봅니다. ChatKHU 를 호출하지 않으므로 크레딧이 들지 않습니다.
import { apiKey, overCap } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';

export async function GET(): Promise<Response> {
  const live = !!apiKey() && !(await overCap());
  return json({ ok: true, live }, 200);
}
