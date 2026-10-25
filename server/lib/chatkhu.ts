// ChatKHU 호출은 전부 이 파일을 거칩니다. (CLAUDE.md 4절 서버 공통 규칙)
// 키 선택, 호출, 사용량 기록, 일일 상한 검사, 실패 시 데모 응답을 여기서 처리합니다.
// 요청·응답 형식은 docs/chatkhu-api.md 에 적힌 확인 내용을 따릅니다.
import { createRequire } from 'node:module';
import { COOKIE_ESSAY_SYSTEM } from '../prompts/essay-chat.js';
import { COOKIE_EXPLORE_SYSTEM } from '../prompts/explore-chat.js';
import { COOKIE_INTERVIEW_SYSTEM } from '../prompts/interview-chat.js';
import { COOKIE_MOCK_SYSTEM } from '../prompts/mock-chat.js';
import { categoryFromHint, interviewScript, type InterviewDemo } from '../../src/lib/demoScript.js';

// 체험 대본. Vercel 은 이 파일을 Node ESM 으로 돌리는데 ESM 은 JSON 을 import 할 수 없어 require 로 읽습니다.
// vercel.json 의 includeFiles 가 server/demo/*.json 을 함수에 같이 넣습니다.
// 타입은 JSON 파일에서 그대로 가져옵니다(typeof import 는 타입 전용이라 실행 시 import 가 생기지 않습니다).
const requireJson = createRequire(import.meta.url);
const loadDemo = <T>(name: string): T => requireJson(`../demo/${name}.json`) as T;
const essayDemo = loadDemo<typeof import('../demo/essay.json')>('essay');
const exploreDemo = loadDemo<typeof import('../demo/explore.json')>('explore');
export const interviewDemo: InterviewDemo & typeof import('../demo/interview.json') = loadDemo('interview');
const mockDemo = loadDemo<typeof import('../demo/mock.json')>('mock');

export type Msg = { role: 'user' | 'assistant' | 'system'; content: string };
export type ChatResult = { bubbles: string[]; credits?: number; demo: boolean; reason?: string };
export type JsonResult<T> = { data: T; credits?: number; demo: boolean; reason?: string };
export type Bot = 'explore' | 'interview' | 'essay' | 'mock';

const BASE = () => (process.env.CHATKHU_BASE || 'https://factchat-cloud.mindlogic.ai/v1/gateway').replace(/\/$/, '');
export const apiKey = (): string => process.env.CHATKHU_API_KEY || process.env.CHATKHU_API_KEY_A || '';
export const gatewayBase = BASE;
const MODEL = () => process.env.CHATKHU_MODEL || 'claude-sonnet-5-5';
const CAP = () => Number(process.env.DAILY_CREDIT_CAP || 550);
export const botId = (bot: string): string => process.env[`CHATKHU_BOT_${bot.toUpperCase()}`] || '';

// 챗봇 id 가 없을 때 일반 모델에 붙이는 지시문 (스튜디오 챗봇에도 같은 규약을 넣습니다)
const FALLBACK_SYSTEM: Record<Bot, string> = {
  explore: COOKIE_EXPLORE_SYSTEM,
  interview: COOKIE_INTERVIEW_SYSTEM,
  essay: COOKIE_ESSAY_SYSTEM,
  mock: COOKIE_MOCK_SYSTEM,
};
// 체험 모드 대본
const DEMO_REPLIES: Record<Bot, string[][]> = {
  explore: exploreDemo.replies,
  interview: interviewDemo.replies,
  essay: essayDemo.replies,
  mock: mockDemo.replies,
};
export const demoData = {
  explore: exploreDemo.result,
  experience: interviewDemo.result,
  analysis: interviewDemo.analysis,
  post: essayDemo.post,
  draft: essayDemo.draft,
  feedback: essayDemo.feedback,
  revise: essayDemo.revise,
  score: mockDemo.result,
  answers: mockDemo.userScript,
};

// 1K 토큰당 (입력, 출력) 크레딧 추정 단가. 문서에 공식 단가가 없어 CLAUDE.md 값을 쓰고, usage 가 없으면 글자 수÷2 로 근사합니다.
const PRICE: Record<string, [number, number]> = {
  'claude-sonnet-5-5': [2, 10],
  'claude-haiku-5-5': [1, 5],
  'gemini-3.8-flash': [0.75, 3.75],
};

// ---- 사용량: Vercel KV(REST)가 설정되어 있으면 그것을, 아니면 인스턴스 메모리를 씁니다.
const mem = new Map<string, number>();
const today = () => new Date().toISOString().slice(0, 10);

async function kv(command: unknown[]): Promise<number | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(command) });
    const j = (await r.json()) as { result?: unknown };
    return Number(j.result ?? 0);
  } catch {
    return null;
  }
}

export async function usedToday(): Promise<number> {
  const key = `usage:${today()}`;
  return (await kv(['GET', key])) ?? mem.get(key) ?? 0;
}

export async function record(credits: number, anon: string): Promise<void> {
  const total = `usage:${today()}`;
  const perUser = `usage:${today()}:anon:${anon}`;
  if ((await kv(['INCRBYFLOAT', total, credits])) === null) mem.set(total, (mem.get(total) ?? 0) + credits);
  if ((await kv(['INCR', perUser])) === null) mem.set(perUser, (mem.get(perUser) ?? 0) + 1);
}

export async function overCap(): Promise<boolean> {
  return (await usedToday()) >= CAP();
}

type Usage = { prompt_tokens?: number; completion_tokens?: number } | null | undefined;
function estimate(model: string, usage: Usage, chars: number): number {
  const [inPrice, outPrice] = PRICE[model] ?? PRICE['claude-sonnet-5-5'];
  if (usage?.prompt_tokens !== undefined) return ((usage.prompt_tokens ?? 0) * inPrice + (usage.completion_tokens ?? 0) * outPrice) / 1000;
  return ((chars / 2) * (inPrice + outPrice)) / 1000;
}

type Completion = { choices?: { message?: { content?: string } }[]; usage?: Usage; credits?: number };

async function call(path: string, body: unknown): Promise<Completion> {
  const r = await fetch(`${BASE()}${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ChatKHU ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()) as Completion;
}

const userCount = (messages: Msg[]) => messages.filter((m) => m.role === 'user').length;
function demoBubbles(bot: Bot, messages: Msg[], systemHint?: string): string[] {
  const replies = bot === 'interview' ? interviewScript(interviewDemo, categoryFromHint(systemHint)).replies : DEMO_REPLIES[bot];
  return replies[Math.min(Math.max(userCount(messages) - 1, 0), replies.length - 1)];
}

export const isBot = (value: string): value is Bot => value === 'explore' || value === 'interview' || value === 'essay' || value === 'mock';

// 대화형. 챗봇 id가 있으면 스튜디오 챗봇, 키만 있으면 일반 모델 + 쿠키 지시문, 둘 다 없거나 상한·오류면 데모.
export async function chat(bot: Bot, messages: Msg[], anon: string, systemHint?: string): Promise<ChatResult> {
  const history = messages.filter((m) => m.role !== 'system');
  if (!apiKey()) return { bubbles: demoBubbles(bot, history, systemHint), demo: true, reason: 'no-key' };
  if (await overCap()) return { bubbles: demoBubbles(bot, history, systemHint), demo: true, reason: 'cap' };
  const chars = history.reduce((n, m) => n + m.content.length, 0);
  const model = MODEL();
  try {
    const id = botId(bot);
    const res = id
      ? await call(`/chatbots/${id}/chat/completions/`, { messages: history, stream: false })
      : await call('/chat/completions/', {
          model,
          messages: [{ role: 'system', content: FALLBACK_SYSTEM[bot] + (systemHint ? `\n\n[화면 문맥] ${systemHint}` : '') }, ...history],
          temperature: 0.8,
          max_tokens: 1024,
        });
    const content = res.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) throw new Error('empty response');
    const credits = typeof res.credits === 'number' ? res.credits : estimate(model, res.usage, chars + content.length);
    await record(credits, anon);
    return { bubbles: [content], credits, demo: false };
  } catch (e) {
    return { bubbles: demoBubbles(bot, history, systemHint), demo: true, reason: (e as Error).message };
  }
}

// 구조화 출력. JSON.parse 뒤 validate 로 검증하고, 실패하면 1회 재시도한 뒤 오류를 던집니다. (CLAUDE.md 4절)
export async function completeJson<T>(
  system: string,
  messages: Msg[],
  schema: object,
  name: string,
  anon: string,
  validate: (data: unknown) => T,
  demoValue: T,
): Promise<JsonResult<T>> {
  if (!apiKey()) return { data: demoValue, demo: true, reason: 'no-key' };
  if (await overCap()) return { data: demoValue, demo: true, reason: 'cap' };
  const model = MODEL();
  const chars = system.length + messages.reduce((n, m) => n + m.content.length, 0);
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await call('/chat/completions/', {
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } },
      });
      const raw = res.choices?.[0]?.message?.content ?? '';
      const data = validate(JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()));
      const credits = typeof res.credits === 'number' ? res.credits : estimate(model, res.usage, chars + raw.length);
      await record(credits, anon);
      return { data, credits, demo: false };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }
  throw new Error(lastError);
}
