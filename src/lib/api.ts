import essayDemo from '../../server/demo/essay.json';
import exploreDemo from '../../server/demo/explore.json';
import interviewDemo from '../../server/demo/interview.json';
import mockDemo from '../../server/demo/mock.json';
import type { ChatTurn, Experience } from './db';
import {
  EssayDraftSchema,
  ExperienceCardSchema,
  ExploreResultSchema,
  PostExtractSchema,
  ScoreSchema,
  type EssayDraft,
  type ExperienceCard,
  type ExploreResult,
  type PostExtract,
  type ScoreResult,
} from './schema';

export type Bot = 'explore' | 'interview' | 'essay' | 'mock';
export type Msg = { role: 'user' | 'assistant'; content: string };
export type ChatReply = { bubbles: string[]; credits?: number; demo: boolean };
type Wrapped<T> = { result: T; credits?: number; demo: boolean };

class HttpError extends Error {
  constructor(public status: number, public detail?: string) {
    super(`HTTP ${status}`);
  }
}

function anonId(): string {
  try {
    let id = localStorage.getItem('khu-anon');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('khu-anon', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-anon-id': anonId() },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = await r
      .json()
      .then((j: { error?: string }) => j.error)
      .catch(() => undefined);
    throw new HttpError(r.status, detail);
  }
  return (await r.json()) as T;
}

// 우리 서버가 실제로 실패한 경우(500번대)만 "다시 시도"로 안내합니다.
// 서버가 없는 GitHub Pages(404, 405)나 네트워크 오류는 체험 모드로 돌아갑니다.
async function postOrDemo<T>(path: string, body: unknown, validate: (d: unknown) => T, demo: () => T, demoDelay: number, failMessage: string): Promise<Wrapped<T>> {
  try {
    const r = await post<{ result: unknown; credits?: number; demo?: boolean }>(path, body);
    return { result: validate(r.result), credits: r.credits, demo: !!r.demo };
  } catch (e) {
    if (e instanceof HttpError && e.status >= 500) throw new Error(e.detail || failMessage);
    if (e instanceof HttpError && e.status === 400) throw new Error(e.detail || failMessage);
    await wait(demoDelay);
    return { result: demo(), demo: true };
  }
}

// ---------- 대화 ----------
const DEMO_REPLIES: Record<Bot, string[][]> = { explore: exploreDemo.replies, interview: interviewDemo.replies, essay: interviewDemo.replies, mock: mockDemo.replies };
const DEMO_SCRIPT: Record<Bot, string[]> = { explore: exploreDemo.userScript, interview: interviewDemo.userScript, essay: interviewDemo.userScript, mock: mockDemo.userScript };
const userCount = (messages: Msg[]) => messages.filter((m) => m.role === 'user').length;

export function demoReply(bot: Bot, messages: Msg[]): string[] {
  const replies = DEMO_REPLIES[bot];
  return replies[Math.min(Math.max(userCount(messages) - 1, 0), replies.length - 1)];
}
export function demoSuggestion(bot: Bot, messages: Msg[]): string | undefined {
  return DEMO_SCRIPT[bot][userCount(messages)];
}

export async function chat(bot: Bot, messages: Msg[], systemHint?: string): Promise<ChatReply> {
  try {
    return await post<ChatReply>(`/api/chat/${bot}`, { messages, systemHint });
  } catch {
    await wait(900);
    return { bubbles: demoReply(bot, messages), demo: true };
  }
}

export const toMsgs = (turns: ChatTurn[]): Msg[] => turns.map(({ role, content }) => ({ role, content }));

// ---------- 구조화 출력 ----------
export const extract = (messages: Msg[]) =>
  postOrDemo<ExploreResult>('/api/extract', { messages }, (d) => ExploreResultSchema.parse(d), () => ExploreResultSchema.parse(exploreDemo.result), 2600, '분석에 실패했어요. 다시 시도해 주세요.');

export const extractExperience = (messages: Msg[], category?: string) =>
  postOrDemo<ExperienceCard>(
    '/api/extract-experience',
    { messages, category },
    (d) => ExperienceCardSchema.parse(d),
    () => ExperienceCardSchema.parse(category ? { ...interviewDemo.result, category } : interviewDemo.result),
    1800,
    '카드 정리에 실패했어요. 다시 시도해 주세요.',
  );

export async function fetchJobPost(url: string): Promise<{ text: string; demo: boolean }> {
  try {
    return await post<{ text: string; demo: boolean }>('/api/job-post', { url });
  } catch (e) {
    if (e instanceof HttpError && e.status >= 400 && e.status !== 404 && e.status !== 405) throw new Error(e.detail || '공고를 가져오지 못했어요. 본문을 직접 붙여 넣어 주세요.');
    await wait(900);
    return { text: essayDemo.post.text, demo: true };
  }
}

export const extractPost = (text: string) =>
  postOrDemo<PostExtract>(
    '/api/extract-post',
    { text },
    (d) => PostExtractSchema.parse(d),
    () => PostExtractSchema.parse({ keywords: essayDemo.post.keywords, values: essayDemo.post.values, deadline: essayDemo.post.deadline, questions: essayDemo.post.questions }),
    1500,
    '공고 분석에 실패했어요. 다시 시도해 주세요.',
  );

export type DraftInput = {
  mode: 'draft' | 'feedback';
  company: string;
  job: string;
  keywords: string[];
  values?: string;
  question: string;
  limit: number;
  experiences: Pick<Experience, 'title' | 'role' | 'activities' | 'achievements' | 'learned' | 'skills'>[];
  body?: string;
};
export const draftEssay = (input: DraftInput) =>
  postOrDemo<EssayDraft>(
    '/api/essay-draft',
    input,
    (d) => EssayDraftSchema.parse(d),
    () => (input.mode === 'draft' ? EssayDraftSchema.parse(essayDemo.draft) : { body: input.body ?? '', feedback: essayDemo.feedback }),
    2200,
    '초안 작성에 실패했어요. 다시 시도해 주세요.',
  );

export const scoreInterview = (messages: Msg[], type: string, job?: string) =>
  postOrDemo<ScoreResult>('/api/score', { messages, type, job }, (d) => ScoreSchema.parse(d), () => ScoreSchema.parse(mockDemo.result), 2400, '채점에 실패했어요. 다시 시도해 주세요.');

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<{ ok: boolean; demo: boolean }> {
  try {
    return await post<{ ok: boolean; demo: boolean }>('/api/push', { subscription });
  } catch {
    return { ok: false, demo: true };
  }
}
