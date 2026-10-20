// 홈의 선제 메시지. "앱을 열면 쿠키가 먼저 말해요." 규칙은 코드로 정합니다. (CLAUDE.md 9절)
import type { Application, Experience, MockSession, Profile, Task } from './db';
import { daysUntil } from './dday';
import { greetingByHour } from './greeting';

export type Nudge = { text: string; cta?: { label: string; to: string } };

// 이름 뒤에 붙는 호격 조사. 받침이 있으면 "아", 없으면 "야".
export function vocative(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${name}야`;
  return (code - 0xac00) % 28 === 0 ? `${name}야` : `${name}아`;
}

export function buildNudge(input: {
  profile?: Profile | null;
  applications: Application[];
  experiences: Experience[];
  tasks: Task[];
  sessions: MockSession[];
  now?: Date;
}): Nudge {
  const now = input.now ?? new Date();
  const call = input.profile?.nickname ? `${vocative(input.profile.nickname)}, ` : '';
  const active = input.applications.filter((a) => a.stage !== '최종' && a.stage !== '서류불합격');

  const soon = active
    .filter((a) => a.deadline)
    .map((a) => ({ a, d: daysUntil(a.deadline as string, now) }))
    .filter((x) => x.d >= 0)
    .sort((x, y) => x.d - y.d)[0];
  if (soon && soon.d <= 3) {
    const left = soon.a.questions.filter((q) => q.status !== '완료').length;
    return {
      text: `${call}${soon.a.company} ${soon.a.job} 서류 마감이 ${soon.d === 0 ? '오늘' : `${soon.d}일 뒤`}야.\n${left ? `남은 문항 ${left}개부터 같이 끝내자.` : '제출 전에 한 번만 더 읽어 보자.'}`,
      cta: { label: '자소서 열기', to: `/essay/${soon.a.id}` },
    };
  }

  const interviewing = active.find((a) => a.stage === '면접');
  if (interviewing && !input.sessions.some((s) => s.appId === interviewing.id)) {
    return {
      text: `${call}${interviewing.company} 면접이 잡혔구나!\n예상 질문으로 모의 면접 한 번 해 볼까?`,
      cta: { label: '모의 면접 시작', to: '/mock' },
    };
  }

  const pending = active.find((a) => a.questions.some((q) => q.status !== '완료'));
  if (pending) {
    const left = pending.questions.filter((q) => q.status !== '완료').length;
    return {
      text: `${call}${pending.company} 자소서 문항 ${left}개가 아직 비어 있어.\n경험 카드 골라서 초안부터 만들어 볼까?`,
      cta: { label: '초안 만들기', to: `/essay/${pending.id}` },
    };
  }

  const todo = input.tasks.filter((t) => !t.done && daysUntil(t.dueAt, now) <= 1);
  if (todo.length) {
    return { text: `${call}오늘까지 할 일이 ${todo.length}개 있어.\n하나씩 체크하면서 가자.`, cta: { label: '일정 보기', to: '/schedule' } };
  }

  if (!input.profile?.targetJobs.length) {
    return {
      text: `${greetingByHour(now.getHours())}\n${call}아직 직무를 못 정했어도 괜찮아.\n나랑 가볍게 이야기하면서 찾아보자!`,
      cta: { label: '직무 탐색 시작하기', to: '/explore' },
    };
  }

  if (input.experiences.length < 3) {
    return {
      text: `${call}경험 카드가 ${input.experiences.length}개야.\n3개만 모아도 자소서가 훨씬 쉬워져. 하나 더 만들까?`,
      cta: { label: '경험 카드 만들기', to: '/profile/experience/new' },
    };
  }

  return {
    text: `${greetingByHour(now.getHours())}\n${call}오늘은 어떤 걸 준비해 볼까?`,
    cta: { label: '지원 건 추가하기', to: '/essay/new' },
  };
}
