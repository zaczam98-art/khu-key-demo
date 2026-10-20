import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { chat as sendChat, demoSuggestion, toMsgs } from '../lib/api';
import { db, type ChatTurn } from '../lib/db';
import { splitEvents, type BotEvent } from '../lib/events';
import { useOnline } from '../lib/hooks';
import { mask } from '../lib/mask';
import { useAppStore } from '../store';
import { Character, type Expr } from './Character';
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
  const [mood, setMood] = useState<Expr>('default');
  const mode = useAppStore((s) => s.mode);
  const note = useAppStore((s) => s.note);
  const online = useOnline();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoredCount = useRef(0); // 복원된 말풍선만 순서대로 등장시키고, 새 말풍선은 바로 보여 줍니다

  // 대화 로그 복원. 비어 있으면 고정 첫 말풍선만 넣습니다.
  useEffect(() => {
    let alive = true;
    db.chatLogs.get(logId).then((log) => {
      if (!alive) return;
      const saved = log?.turns ?? [];
      const initial = saved.length || !intro ? saved : [{ role: 'assistant' as const, content: intro, at: new Date().toISOString() }];
      restoredCount.current = initial.length;
      setTurns(initial);
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
      setMood('smile');
      window.setTimeout(() => setMood('default'), 1800);
      events.forEach((event) => onEvent?.(event));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };
  // 한글 조합 중 Enter 가 미완성 글자를 보내지 않게 막습니다.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
  };

  const list = turns ?? [];
  const userCount = list.filter((t) => t.role === 'user').length;
  const last = list[list.length - 1];
  const lastBot = last?.role === 'assistant' ? last.content : undefined;
  const bullets = bulletLines(lastBot);
  const suggestion = mode !== 'live' ? demoSuggestion(toMsgs(list)) : undefined;
  const chips = quickReplies ?? (bullets.length ? bullets : suggestion ? [suggestion] : []);
  const delayFor = (i: number) => (i < restoredCount.current ? `${Math.min(i, 8) * 60}ms` : '0ms');

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <ChatHeader expr={busy ? 'think' : mood} back={back} online={online} />
      {progress !== undefined && (
        <div className="h-1 bg-lavender">
          <div className="h-1 bg-primary transition-all duration-500" style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }} />
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {turns === null && (
          <>
            <div className="flex items-start gap-2">
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="skeleton h-16 w-52 rounded-bubble rounded-tl-md" />
            </div>
            <div className="flex justify-end">
              <div className="skeleton h-10 w-40 rounded-bubble rounded-tr-md" />
            </div>
          </>
        )}
        {list.map((turn, i) =>
          turn.role === 'assistant' ? (
            <div key={i} className="rise flex items-start gap-2" style={{ animationDelay: delayFor(i) }}>
              <Character expr="default" size={36} className="mt-1 shrink-0 rounded-full bg-lavender" />
              <div>
                <div className="bubble-bot">{turn.content}</div>
                <div className="ml-1 mt-1 text-[11px] text-muted">{formatTime(turn.at)}</div>
              </div>
            </div>
          ) : (
            <div key={i} className="rise flex justify-end" style={{ animationDelay: delayFor(i) }}>
              <div className="bubble-user">{turn.content}</div>
            </div>
          ),
        )}
        {busy && (
          <div className="pop flex items-start gap-2">
            <Character expr="think" size={36} className="mt-1 shrink-0 rounded-full bg-lavender" />
            <div className="bubble-bot" aria-label="쿠키가 입력 중">
              <span className="typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
        {!busy && turns && chips.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-11">
            {chips.map((chip, i) => (
              <button key={chip} type="button" onClick={() => void send(chip)} className="chip pop press text-left" style={{ animationDelay: `${i * 70}ms` }}>
                {chip}
              </button>
            ))}
          </div>
        )}
        {!busy && userCount >= maxTurns && (
          <div className="pop pl-11">
            <button type="button" onClick={() => onEvent?.({ type: 'analyze' })} className="chip chip-primary press">
              지금까지 대화로 분석하기 →
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {!online && <p className="bg-warn/10 px-4 py-1.5 text-center text-[12px] text-warn">지금은 오프라인이야. 연결되면 다시 보내 줘.</p>}
      <form onSubmit={submit} className="flex items-center gap-2 bg-canvas px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        <button type="button" aria-label="추가" className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl text-ink shadow-card">
          ＋
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="쿠키에게 메시지 보내기..."
          enterKeyHint="send"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[14px] text-ink shadow-card outline-none ring-primary/30 transition-shadow placeholder:text-muted/70 focus:ring-2"
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={!text.trim() || busy}
          className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-white transition-[background-color,box-shadow] ${
            text.trim() && !busy ? 'bg-primary shadow-[0_4px_14px_rgba(123,108,246,0.45)]' : 'bg-primary/40'
          }`}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
