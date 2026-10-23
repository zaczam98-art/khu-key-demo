import interviewDemo from '../../server/demo/interview.json';

// 경험 인터뷰 체험 대본을 분류별로 고릅니다. 브라우저(체험 모드)와 서버(키 없음·상한 초과)가 같이 씁니다.
export type InterviewScript = { replies: string[][]; userScript: string[]; result: unknown };

const byCategory = interviewDemo.byCategory as Record<string, InterviewScript>;

// ChatShell 이 보내는 화면 문맥 "사용자가 고른 경험 분류: 동아리 (1/2번째)" 에서 분류만 꺼냅니다.
export function categoryFromHint(hint?: string): string | undefined {
  const m = hint?.match(/분류:\s*([^\s(]+)/);
  return m?.[1];
}

export function interviewScript(category?: string): InterviewScript {
  const own = category ? byCategory[category] : undefined;
  if (!own) return { replies: interviewDemo.replies, userScript: interviewDemo.userScript, result: interviewDemo.result };
  const last = interviewDemo.replies[interviewDemo.replies.length - 1];
  return { replies: [...own.replies, last], userScript: own.userScript, result: own.result };
}
