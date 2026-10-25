// POST /api/chat/:bot  { messages: [{role, content}], systemHint? } -> { bubbles: string[], credits?, demo }
import { chat, isBot, type Msg } from '../../server/lib/chatkhu.js';
import { json } from '../../server/lib/http.js';

const RECENT = 16; // 최근 8턴(사용자+루다 쌍)만 보냅니다. (CLAUDE.md 12절)

export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const bot = url.searchParams.get('bot') ?? url.pathname.split('/').filter(Boolean).pop() ?? '';
  if (!isBot(bot)) return json({ error: 'unknown bot' }, 404);
  const body = (await req.json().catch(() => null)) as { messages?: Msg[]; systemHint?: string } | null;
  const messages = (body?.messages ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
  if (!messages.length) return json({ error: 'messages required' }, 400);
  const anon = req.headers.get('x-anon-id') ?? 'anon';
  const reply = await chat(bot, messages.slice(-RECENT), anon, body?.systemHint);
  return json(reply);
}
