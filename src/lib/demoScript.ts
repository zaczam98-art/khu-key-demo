// 경험 인터뷰 체험 대본을 분류별로 고릅니다. 브라우저(체험 모드)와 서버(키 없음·상한 초과)가 같이 씁니다.
// JSON 은 호출하는 쪽이 넘깁니다. 서버는 Node ESM 이라 JSON 을 import 할 수 없고 createRequire 로 읽기 때문입니다.
export type InterviewScript = { replies: string[][]; userScript: string[]; result: unknown };
export type InterviewDemo = InterviewScript & { byCategory?: Record<string, InterviewScript> };

// ChatShell 이 보내는 화면 문맥 "사용자가 고른 경험 분류: 동아리 (1/2번째)" 에서 분류만 꺼냅니다.
export function categoryFromHint(hint?: string): string | undefined {
  const m = hint?.match(/분류:\s*([^\s(]+)/);
  return m?.[1];
}

export function interviewScript(demo: InterviewDemo, category?: string): InterviewScript {
  const own = category ? demo.byCategory?.[category] : undefined;
  if (!own) return { replies: demo.replies, userScript: demo.userScript, result: demo.result };
  const last = demo.replies[demo.replies.length - 1];
  return { replies: [...own.replies, last], userScript: own.userScript, result: own.result };
}
