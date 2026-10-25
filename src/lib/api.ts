import essayDemo from '../../server/demo/essay.json';
import exploreDemo from '../../server/demo/explore.json';
import interviewDemo from '../../server/demo/interview.json';
import mockDemo from '../../server/demo/mock.json';
import type { ChatTurn, Experience } from './db';
import { categoryFromHint, interviewScript } from './demoScript';
import {
  EssayDraftSchema,
  ExperienceCardSchema,
  ExploreResultSchema,
  PostExtractSchema,
  ProfileAnalysisSchema,
  ScoreSchema,
  type EssayDraft,
  type ExperienceCard,
  type ExploreResult,
  type PostExtract,
  type ProfileAnalysis,
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

async function request(path: string, init: RequestInit): Promise<Response> {
  const r = await fetch(path, { ...init, headers: { ...(init.headers as Record<string, string>), 'x-anon-id': anonId() } });
  if (!r.ok) {
    const detail = await r
      .json()
      .then((j: { error?: string }) => j.error)
      .catch(() => undefined);
    throw new HttpError(r.status, detail);
  }
  return r;
}
const post = async <T,>(path: string, body: unknown): Promise<T> =>
  (await request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json() as Promise<T>;

// 우리 서버가 실제로 실패한 경우(500번대, 400)만 안내하고, 서버가 없는 GitHub Pages(404, 405)나 네트워크 오류는 체험 모드로 돌아갑니다.
const isNoServer = (e: unknown) => !(e instanceof HttpError) || e.status === 404 || e.status === 405;
async function postOrDemo<T>(path: string, body: unknown, validate: (d: unknown) => T, demo: () => T, demoDelay: number, failMessage: string): Promise<Wrapped<T>> {
  try {
    const r = await post<{ result: unknown; credits?: number; demo?: boolean }>(path, body);
    return { result: validate(r.result), credits: r.credits, demo: !!r.demo };
  } catch (e) {
    if (!isNoServer(e)) throw new Error((e as HttpError).detail || failMessage);
    await wait(demoDelay);
    return { result: demo(), demo: true };
  }
}

// ---------- 대화 ----------
const DEMO_REPLIES: Record<Bot, string[][]> = { explore: exploreDemo.replies, interview: interviewDemo.replies, essay: essayDemo.replies, mock: mockDemo.replies };
const DEMO_SCRIPT: Record<Bot, string[]> = { explore: exploreDemo.userScript, interview: interviewDemo.userScript, essay: essayDemo.userScript, mock: mockDemo.userScript };
const userCount = (messages: Msg[]) => messages.filter((m) => m.role === 'user').length;

// 경험 인터뷰는 화면 문맥(systemHint)의 분류에 맞는 대본을 씁니다. 분류마다 다른 카드가 나오게 하기 위해서입니다.
export function demoReply(bot: Bot, messages: Msg[], systemHint?: string): string[] {
  const replies = bot === 'interview' ? interviewScript(interviewDemo, categoryFromHint(systemHint)).replies : DEMO_REPLIES[bot];
  return replies[Math.min(Math.max(userCount(messages) - 1, 0), replies.length - 1)];
}
export function demoSuggestion(bot: Bot, messages: Msg[], systemHint?: string): string | undefined {
  const script = bot === 'interview' ? interviewScript(interviewDemo, categoryFromHint(systemHint)).userScript : DEMO_SCRIPT[bot];
  return script[userCount(messages)];
}

export async function chat(bot: Bot, messages: Msg[], systemHint?: string): Promise<ChatReply> {
  try {
    return await post<ChatReply>(`/api/chat/${bot}`, { messages, systemHint });
  } catch {
    await wait(900);
    return { bubbles: demoReply(bot, messages, systemHint), demo: true };
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
    () => ExperienceCardSchema.parse(interviewScript(interviewDemo, category).result),
    1800,
    '카드 정리에 실패했어요. 다시 시도해 주세요.',
  );

export type CardSummary = Pick<Experience, 'title' | 'category' | 'role' | 'activities' | 'achievements' | 'learned' | 'skills'>;
export const analyzeProfile = (cards: CardSummary[]) =>
  postOrDemo<ProfileAnalysis>('/api/analyze-profile', { cards }, (d) => ProfileAnalysisSchema.parse(d), () => ProfileAnalysisSchema.parse(interviewDemo.analysis), 2200, '종합 분석에 실패했어요. 다시 시도해 주세요.');

export async function fetchJobPost(url: string): Promise<{ text: string; demo: boolean }> {
  try {
    return await (await request('/api/job-post', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })).json();
  } catch (e) {
    if (!isNoServer(e)) throw new Error((e as HttpError).detail || '공고를 가져오지 못했어요. 본문을 직접 붙여 넣어 주세요.');
    await wait(900);
    return { text: essayDemo.post.text, demo: true };
  }
}

export const extractPost = (text: string) =>
  postOrDemo<PostExtract>(
    '/api/extract-post',
    { text },
    (d) => PostExtractSchema.parse(d),
    () => {
      const { summary, keywords, values, deadline, questions } = essayDemo.post;
      return PostExtractSchema.parse({ summary, keywords, values, deadline, questions });
    },
    1500,
    '공고 분석에 실패했어요. 다시 시도해 주세요.',
  );

export type DraftInput = {
  mode: 'draft' | 'feedback' | 'revise';
  company: string;
  job: string;
  keywords: string[];
  values?: string;
  question: string;
  limit: number;
  experiences: Pick<Experience, 'title' | 'role' | 'activities' | 'achievements' | 'learned' | 'skills'>[];
  body?: string;
  points?: string[];
};
export const draftEssay = (input: DraftInput) =>
  postOrDemo<EssayDraft>(
    '/api/essay-draft',
    input,
    (d) => EssayDraftSchema.parse(d),
    () =>
      EssayDraftSchema.parse(
        input.mode === 'draft' ? essayDemo.draft : input.mode === 'revise' ? essayDemo.revise : { body: input.body ?? '', ...essayDemo.feedback },
      ),
    2200,
    '자소서 작업에 실패했어요. 다시 시도해 주세요.',
  );

export const scoreInterview = (messages: Msg[], type: string, job?: string, company?: string) =>
  postOrDemo<ScoreResult>('/api/score', { messages, type, job, company }, (d) => ScoreSchema.parse(d), () => ScoreSchema.parse(mockDemo.result), 2400, '채점에 실패했어요. 다시 시도해 주세요.');

// ---------- 음성 ----------
export async function transcribeAudio(wav: Blob, turn: number): Promise<{ text: string; demo: boolean }> {
  const form = new FormData();
  form.append('file', wav, 'answer.wav');
  form.append('turn', String(turn));
  try {
    return await (await request('/api/stt', { method: 'POST', body: form })).json();
  } catch (e) {
    if (!isNoServer(e)) throw new Error((e as HttpError).detail || '받아쓰기에 실패했어요. 글로 답해 주세요.');
    await wait(1200);
    return { text: mockDemo.userScript[Math.min(Math.max(turn, 0), mockDemo.userScript.length - 1)], demo: true };
  }
}

// 서버 TTS 가 있으면 오디오를, 없으면 null 을 돌려줍니다(호출한 쪽이 브라우저 음성 합성으로 대체).
export async function fetchSpeech(text: string): Promise<Blob | null> {
  try {
    const r = await request('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
    if (r.status === 204) return null;
    return await r.blob();
  } catch {
    return null;
  }
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<{ ok: boolean; demo: boolean }> {
  try {
    return await post<{ ok: boolean; demo: boolean }>('/api/push', { subscription });
  } catch {
    return { ok: false, demo: true };
  }
}
