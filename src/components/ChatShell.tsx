import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type UIEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { chat as sendChat, demoSuggestion, toMsgs, type Bot } from '../lib/api';
import { db, type ChatTurn } from '../lib/db';
import { splitEvents, type BotEvent } from '../lib/events';
import { useOnline } from '../lib/hooks';
import { mask } from '../lib/mask';
import { useAppStore } from '../store';
import { Character, type Expr } from './Character';
import { ChatHeader } from './Header';
import { Icon } from './Icon';

// 모든 대화 화면이 쓰는 공용 채팅 컴포넌트 (CLAUDE.md 6절)
export type ChatShellProps = {
  bot: Bot;
  intro?: string; // 서버 호출 없이 보여 주는 고정 첫 말풍선
  systemHint?: string;
  quickReplies?: string[];
  quickActions?: { label: string; to: string }[]; // 보내는 대신 화면을 여는 칩 (첫 메시지 전까지)
  onEvent?: (event: BotEvent) => void;
  maxTurns?: number; // 이 수만큼 사용자 메시지가 쌓이면 마무리 칩을 보여 줍니다
  progress?: number; // 0~1
  back?: string;
  title?: string;
  persona?: { name: string; expr: Expr }; // 면접관처럼 쿠키가 아닌 상대
  finishChip?: string; // 마무리 칩 문구
  finishEvent?: string; // 마무리 칩이 보낼 이벤트 이름
  logKey?: string; // 로그 저장 키 (기본 log:<bot>)
  noBack?: boolean; // 탭 첫 화면처럼 뒤로 가기가 없는 경우
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const closeInTime = (a: ChatTurn, b: ChatTurn) => Math.abs(new Date(a.at).getTime() - new Date(b.at).getTime()) < 2 * 60_000;

// 쿠키 말풍선 안의 "- 선택지" 줄을 칩으로 보여 줍니다. (시안 4번 화면의 업무 스타일 선택지)
const bulletLines = (text?: string) =>
  (text ?? '')
    .split('\n')
    .filter((line) => /^[-]\s+/.test(line))
    .map((line) => line.replace(/^[-]\s+/, '').trim())
    .slice(0, 4);

// 새로 온 쿠키 말풍선을 글자 단위로 보여 줍니다. 실제 연결에서 스트리밍 응답을 붙일 때도 같은 자리입니다.
function TypedText({ text, onDone }: { text: string; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const done = shown >= text.length;
  useEffect(() => {
    if (done) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text.length);
      return;
    }
    const step = Math.max(1, Math.ceil(text.length / 70));
    const interval = Math.min(18, 1400 / Math.max(1, text.length / step));
    const t = window.setInterval(() => setShown((n) => Math.min(n + step, text.length)), interval);
    return () => window.clearInterval(t);
  }, [text, done]);
  useEffect(() => {
    if (done) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  return <>{text.slice(0, shown)}</>;
}

export function ChatShell({ bot, intro, systemHint, quickReplies, quickActions, onEvent, maxTurns = 9, progress, back, title, persona, finishChip, finishEvent = 'analyze', logKey, noBack }: ChatShellProps) {
  const nav = useNavigate();
  const logId = logKey ?? `log:${bot}`;
  const [turns, setTurns] = useState<ChatTurn[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<Expr>(persona?.expr ?? 'default');
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const mode = useAppStore((s) => s.mode);
  const note = useAppStore((s) => s.note);
  const online = useOnline();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restoredCount = useRef(0);

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

  const scrollToEnd = (smooth = true) => endRef.current?.scrollIntoView({ block: 'end', behavior: smooth ? 'smooth' : 'auto' });
  useEffect(() => {
    if (atBottom) scrollToEnd();
  }, [turns, busy, typingIndex, atBottom]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const persist = async (next: ChatTurn[]) => {
    setTurns(next);
    await db.chatLogs.put({ id: logId, module: bot, turns: next });
  };

  const send = async (raw: string) => {
    const content = mask(raw.trim());
    if (!content || busy || !turns) return;
    const withUser = [...turns, { role: 'user' as const, content, at: new Date().toISOString() }];
    setText('');
    if (inputRef.current) inputRef.current.style.height = '';
    setAtBottom(true);
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
      if (withBot.length > withUser.length) setTypingIndex(withBot.length - 1);
      if (!persona) {
        setMood('smile');
        window.setTimeout(() => setMood('default'), 1800);
      }
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
  // Enter 는 보내기, Shift+Enter 는 줄바꿈. 한글 조합 중 Enter 는 조합만 끝내고 보내지 않습니다.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    if (e.nativeEvent.isComposing) return;
    void send(text);
  };
  // 입력한 줄 수만큼 늘어나고 6줄 정도에서 멈춥니다.
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = '';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const list = turns ?? [];
  const userCount = list.filter((t) => t.role === 'user').length;
  const last = list[list.length - 1];
  const lastBot = last?.role === 'assistant' ? last.content : undefined;
  const bullets = bulletLines(lastBot);
  const suggestion = mode !== 'live' ? demoSuggestion(bot, toMsgs(list), systemHint) : undefined;
  const chips = quickReplies ?? (bullets.length ? bullets : suggestion ? [suggestion] : []);
  const typing = typingIndex !== null;
  const delayFor = (i: number) => (i < restoredCount.current ? `${Math.min(i, 8) * 60}ms` : '0ms');
  const avatarExpr: Expr = persona?.expr ?? 'default';
  const headerExpr: Expr = busy ? 'think' : mood;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-canvas">
      <ChatHeader expr={headerExpr} name={persona?.name ?? title} back={back} online={online} noBack={noBack} />
      {progress !== undefined && (
        <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-lavender">
          <div className="h-full rounded-full bg-primary transition-all duration-slow ease-app" style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }} />
        </div>
      )}
      <div onScroll={onScroll} className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
        {turns === null && (
          <>
            <div className="flex items-start gap-2">
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="skeleton h-16 w-52 rounded-bubble rounded-tl-md" />
            </div>
            <div className="flex justify-end pt-2">
              <div className="skeleton h-10 w-40 rounded-bubble rounded-tr-md" />
            </div>
          </>
        )}
        {list.map((turn, i) => {
          const prev = list[i - 1];
          const next = list[i + 1];
          const grouped = !!prev && prev.role === turn.role && closeInTime(prev, turn);
          const lastInGroup = !next || next.role !== turn.role || !closeInTime(turn, next);
          const gap = grouped ? 'mt-1' : 'mt-3';
          if (turn.role === 'assistant') {
            return (
              <div key={i} className={`rise flex items-start gap-2 ${gap}`} style={{ animationDelay: delayFor(i) }}>
                {grouped ? <span className="w-9 shrink-0" /> : <Character expr={avatarExpr} size={36} className="mt-1 shrink-0 rounded-full bg-lavender" />}
                <div className="min-w-0">
                  <div className={`bubble-bot ${grouped ? 'rounded-tl-bubble' : ''}`}>
                    {typingIndex === i ? <TypedText text={turn.content} onDone={() => setTypingIndex(null)} /> : turn.content}
                  </div>
                  {lastInGroup && <div className="ml-1 mt-1 text-caption text-muted">{formatTime(turn.at)}</div>}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className={`rise flex justify-end ${gap}`} style={{ animationDelay: delayFor(i) }}>
              <div className={`bubble-user ${grouped ? 'rounded-tr-bubble' : ''}`}>{turn.content}</div>
            </div>
          );
        })}
        {busy && (
          <div className="pop mt-3 flex items-start gap-2">
            <Character expr="think" size={36} className="mt-1 shrink-0 rounded-full bg-lavender" />
            <div className="bubble-bot" aria-label="입력 중">
              <span className="typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
        {!busy && !typing && turns && userCount === 0 && quickActions && quickActions.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 pl-11">
            {quickActions.map((a, i) => (
              <button key={a.label} type="button" onClick={() => nav(a.to, { viewTransition: true })} className="chip pop press w-fit max-w-full text-left" style={{ animationDelay: `${i * 70}ms` }}>
                {a.label}
              </button>
            ))}
          </div>
        )}
        {!busy && !typing && turns && chips.length > 0 && (userCount > 0 || !quickActions) && (
          <div className="mt-3 flex flex-wrap gap-2 pl-11">
            {chips.map((chip, i) => (
              <button key={chip} type="button" onClick={() => void send(chip)} className="chip pop press text-left" style={{ animationDelay: `${i * 70}ms` }}>
                {chip}
              </button>
            ))}
          </div>
        )}
        {!busy && !typing && userCount >= maxTurns && (
          <div className="pop mt-3 pl-11">
            <button type="button" onClick={() => onEvent?.({ type: finishEvent })} className="chip chip-primary press">
              {finishChip ?? '지금까지 대화로 분석하기'}
              <Icon name="arrow" size={14} />
            </button>
          </div>
        )}
        <div ref={endRef} className="h-2" />
      </div>
      {!atBottom && (
        <button
          type="button"
          aria-label="맨 아래로"
          onClick={() => {
            setAtBottom(true);
            scrollToEnd();
          }}
          className="pop press absolute bottom-20 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-primary shadow-pop"
        >
          <Icon name="chevron-down" size={20} />
        </button>
      )}
      {!online && <p className="bg-warn/10 px-4 py-1.5 text-center text-caption text-warn">지금은 오프라인이야. 연결되면 다시 보내 줘.</p>}
      <form onSubmit={submit} className="flex items-end gap-2 bg-canvas px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        <button type="button" aria-label="추가" className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-card">
          <Icon name="plus" size={20} />
        </button>
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            grow(e.target);
          }}
          onKeyDown={onKeyDown}
          placeholder={persona ? `${persona.name}에게 답하기...` : '쿠키에게 메시지 보내기...'}
          enterKeyHint="send"
          autoComplete="off"
          aria-label="메시지 입력"
          className="max-h-[132px] min-h-[44px] min-w-0 flex-1 resize-none rounded-[22px] bg-surface px-4 py-[11px] text-[0.875rem] leading-[22px] text-ink shadow-card outline-none ring-primary/30 transition-shadow duration-fast placeholder:text-muted/70 focus:ring-2"
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={!text.trim() || busy}
          className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-[background-color,box-shadow] duration-fast ${
            text.trim() && !busy ? 'bg-primary shadow-[0_4px_14px_rgba(123,108,246,0.45)]' : 'bg-primary/40'
          }`}
        >
          <Icon name="arrow-up" size={20} />
        </button>
      </form>
    </div>
  );
}
