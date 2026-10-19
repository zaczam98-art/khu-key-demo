import { useEffect, useRef, useState, type FormEvent } from 'react';
import { chat as sendChat, demoSuggestion, toMsgs } from '../lib/api';
import { db, type ChatTurn } from '../lib/db';
import { splitEvents, type BotEvent } from '../lib/events';
import { mask } from '../lib/mask';
import { useAppStore } from '../store';
import { Character } from './Character';
import { ChatHeader } from './Header';

// 모든 대화 화면이 쓰는 공용 채팅 컴포넌트 (CLAUDE.md 6절)
export type ChatShellProps = {
  bot: 'explore' | 'interview' | 'essay' | 'mock';
  intro?: string; // 서버 호출 없이 보여 주는 고정 첫 말풍선
  systemHint?: string;
  quickReplies?: string[];
  onEvent?: (event: BotEvent) => void;
  maxTurns?: number; // 이 수만큼 사용자 메시지가 쌓이면 분석 칩을 보여 줍니다
  progress?: number; // 0~1
  back?: string;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 쿠키 말풍선 안의 "- 선택지" 줄을 칩으로 보여 줍니다. (시안 4번 화면의 업무 스타일 선택지)
const bulletLines = (text?: string) =>
  (text ?? '')
    .split('\n')
    .filter((line) => /^[-•]\s+/.test(line))
    .map((line) => line.replace(/^[-•]\s+/, '').trim())
    .slice(0, 4);

export function ChatShell({ bot, intro, systemHint, quickReplies, onEvent, maxTurns = 9, progress, back }: ChatShellProps) {
  const logId = `log:${bot}`;
  const [turns, setTurns] = useState<ChatTurn[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const mode = useAppStore((s) => s.mode);
  const note = useAppStore((s) => s.note);
  const endRef = useRef<HTMLDivElement>(null);

  // 대화 로그 복원. 비어 있으면 고정 첫 말풍선만 넣습니다.
  useEffect(() => {
    let alive = true;
    db.chatLogs.get(logId).then((log) => {
      if (!alive) return;
      const saved = log?.turns ?? [];
      setTurns(saved.length || !intro ? saved : [{ role: 'assistant', content: intro, at: new Date().toISOString() }]);
    });
    return () => {
      alive = false;
    };
  }, [logId, intro]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [turns, busy]);

  const persist = async (next: ChatTurn[]) => {
    setTurns(next);
    await db.chatLogs.put({ id: logId, module: bot, turns: next });
  };

  const send = async (raw: string) => {
    const content = mask(raw.trim());
    if (!content || busy || !turns) return;
    const withUser = [...turns, { role: 'user' as const, content, at: new Date().toISOString() }];
    setText('');
    await persist(withUser);
    setBusy(true);
    try {
      const reply = await sendChat(bot, toMsgs(withUser), systemHint);
      note(reply.demo, reply.credits);
      const events: BotEvent[] = [];
      const withBot = [...withUser];
      for (const bubble of reply.bubbles) {
        const parsed = splitEvents(bubble);
        events.push(...parsed.events);
        if (parsed.text) withBot.push({ role: 'assistant', content: parsed.text, at: new Date().toISOString() });
      }
      await persist(withBot);
      events.forEach((event) => onEvent?.(event));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  const list = turns ?? [];
  const userCount = list.filter((t) => t.role === 'user').length;
  const last = list[list.length - 1];
  const lastBot = last?.role === 'assistant' ? last.content : undefined;
  const bullets = bulletLines(lastBot);
  const suggestion = mode !== 'live' ? demoSuggestion(toMsgs(list)) : undefined;
  const chips = quickReplies ?? (bullets.length ? bullets : suggestion ? [suggestion] : []);

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <ChatHeader expr={busy ? 'think' : 'default'} back={back} />
      {progress !== undefined && (
        <div className="h-1 bg-lavender">
          <div className="h-1 bg-primary transition-all" style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }} />
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {list.map((turn, i) =>
          turn.role === 'assistant' ? (
            <div key={i} className="flex items-start gap-2">
              <Character expr="default" size={36} className="mt-1 shrink-0 rounded-full bg-lavender" />
              <div>
                <div className="bubble-bot">{turn.content}</div>
                <div className="ml-1 mt-1 text-[11px] text-muted">{formatTime(turn.at)}</div>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="bubble-user">{turn.content}</div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex items-start gap-2">
            <Character expr="think" size={36} className="mt-1 shrink-0 rounded-full bg-lavender" />
            <div className="bubble-bot tracking-[0.3em]">···</div>
          </div>
        )}
        {!busy && turns && chips.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-11">
            {chips.map((chip) => (
              <button key={chip} type="button" onClick={() => void send(chip)} className="chip text-left">
                {chip}
              </button>
            ))}
          </div>
        )}
        {!busy && userCount >= maxTurns && (
          <div className="pl-11">
            <button type="button" onClick={() => onEvent?.({ type: 'analyze' })} className="chip chip-primary">
              지금까지 대화로 분석하기 →
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 bg-canvas px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        <button type="button" aria-label="추가" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl text-ink shadow-card">
          ＋
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="쿠키에게 메시지 보내기..."
          className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[14px] text-ink shadow-card outline-none placeholder:text-muted/70"
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={!text.trim() || busy}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white disabled:opacity-40"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
