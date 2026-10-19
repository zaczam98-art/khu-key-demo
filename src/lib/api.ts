import demo from '../../server/demo/explore.json';
import type { ChatTurn } from './db';
import { ExploreResultSchema, type ExploreResult } from './schema';

export type Msg = { role: 'user' | 'assistant'; content: string };
export type ChatReply = { bubbles: string[]; credits?: number; demo: boolean };
export type ExtractReply = { result: ExploreResult; credits?: number; demo: boolean };

class HttpError extends Error {
  constructor(public status: number) {
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
  if (!r.ok) throw new HttpError(r.status);
  return (await r.json()) as T;
}

const userCount = (messages: Msg[]) => messages.filter((m) => m.role === 'user').length;

// 서버가 없을 때(GitHub Pages)와 서버가 체험 모드일 때 같은 대본을 씁니다.
export function demoReply(messages: Msg[]): string[] {
  const i = Math.min(Math.max(userCount(messages) - 1, 0), demo.replies.length - 1);
  return demo.replies[i];
}
export function demoSuggestion(messages: Msg[]): string | undefined {
  return demo.userScript[userCount(messages)];
}

export async function chat(bot: string, messages: Msg[], systemHint?: string): Promise<ChatReply> {
  try {
    return await post<ChatReply>(`/api/chat/${bot}`, { messages, systemHint });
  } catch {
    await wait(900);
    return { bubbles: demoReply(messages), demo: true };
  }
}

export async function extract(messages: Msg[]): Promise<ExtractReply> {
  try {
    const r = await post<{ result: unknown; credits?: number; demo?: boolean }>('/api/extract', { messages });
    return { result: ExploreResultSchema.parse(r.result), credits: r.credits, demo: !!r.demo };
  } catch (e) {
    // 우리 서버가 실제로 실패한 경우(500번대)만 "다시 시도"로 안내합니다.
    // 서버가 없는 GitHub Pages(404, 405)나 네트워크 오류는 체험 모드로 돌아갑니다.
    if (e instanceof HttpError && e.status >= 500) throw new Error('분석에 실패했어요. 다시 시도해 주세요.');
    await wait(2600);
    return { result: ExploreResultSchema.parse(demo.result), demo: true };
  }
}

export const toMsgs = (turns: ChatTurn[]): Msg[] => turns.map(({ role, content }) => ({ role, content }));
