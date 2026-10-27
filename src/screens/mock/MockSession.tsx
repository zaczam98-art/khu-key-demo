import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Spinner } from '../../components/ui';
import { chat, toMsgs } from '../../lib/api';
import { ANSWER_SECONDS, QUESTION_COUNT } from '../../data/rubric';
import { db, type ChatTurn } from '../../lib/db';
import { splitEvents } from '../../lib/events';
import { mask } from '../../lib/mask';
import { recordingToText, speak, stopSpeaking, useRecorder } from '../../lib/voice';
import { useAppStore } from '../../store';
import { readMockSetup } from './MockSetup';

// 면접 3~7. 면접관 루다가 묻고, 답변은 녹음(받아쓰기)하거나 글로 합니다. (design/04_면접.png 3~7번)
const LOG = 'log:mock';
const BG = `${import.meta.env.BASE_URL}mock/bg-portrait.jpg`;
const FIRST_QUESTION = 'Q1. 자기소개를 해주세요.\n(1분 이내로 부탁드립니다.)';
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function MockSession() {
  const nav = useNavigate();
  const setup = readMockSetup();
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const [turns, setTurns] = useState<ChatTurn[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [muted, setMuted] = useState(false);
  const [hint, setHint] = useState('');
  const rec = useRecorder(ANSWER_SECONDS);
  const spokenRef = useRef<string | null>(null);

  // 로그 복원. 비어 있으면 첫 질문을 고정으로 냅니다.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [log, cards, app] = await Promise.all([db.chatLogs.get(LOG), db.experiences.toArray(), setup.appId ? db.applications.get(setup.appId) : Promise.resolve(undefined)]);
      if (!alive) return;
      const parts = [
        `면접 유형: ${setup.type}`,
        setup.company ? `지원 회사: ${setup.company}` : '',
        setup.job ? `지원 직무: ${setup.job}` : '',
        setup.focus.length ? `연습 방향: ${setup.focus.join(', ')}` : '',
        cards.length ? `지원자의 경험 카드: ${cards.slice(0, 5).map((c) => `${c.title}(${c.skills.join(', ')})`).join(' / ')}` : '',
        setup.useEssay && app ? `지원자의 자소서 요지: ${app.questions.map((q) => q.versions[q.versions.length - 1]?.body.slice(0, 200)).filter(Boolean).join(' / ')}` : '',
      ].filter(Boolean);
      setHint(parts.join('\n'));
      const saved = log?.turns ?? [];
      const initial = saved.length ? saved : [{ role: 'assistant' as const, content: FIRST_QUESTION, at: new Date().toISOString() }];
      if (!saved.length) await db.chatLogs.put({ id: LOG, module: 'mock', turns: initial });
      setTurns(initial);
    })();
    return () => {
      alive = false;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = turns ?? [];
  const answered = list.filter((t) => t.role === 'user').length;
  const question = [...list].reverse().find((t) => t.role === 'assistant')?.content ?? '';
  const number = Math.min(answered + 1, QUESTION_COUNT);

  // 새 질문이 나오면 읽어 줍니다.
  useEffect(() => {
    if (!question || spokenRef.current === question) return;
    spokenRef.current = question;
    void speak(question, muted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const persist = async (next: ChatTurn[]) => {
    setTurns(next);
    await db.chatLogs.put({ id: LOG, module: 'mock', turns: next });
  };

  const submitAnswer = async (raw: string) => {
    const content = mask(raw.trim());
    if (!content || busy || !turns) return;
    setTranscript(null);
    setText('');
    setBusy(true);
    const withUser = [...turns, { role: 'user' as const, content, at: new Date().toISOString() }];
    await persist(withUser);
    try {
      const reply = await chat('mock', toMsgs(withUser), hint);
      note(reply.demo, reply.credits);
      const withBot = [...withUser];
      let scoreNow = false;
      for (const bubble of reply.bubbles) {
        const parsed = splitEvents(bubble);
        if (parsed.events.some((e) => e.type === 'score')) scoreNow = true;
        if (parsed.text && !scoreNow) withBot.push({ role: 'assistant', content: parsed.text, at: new Date().toISOString() });
      }
      await persist(withBot);
      if (scoreNow || withBot.filter((t) => t.role === 'user').length >= QUESTION_COUNT) {
        stopSpeaking();
        nav('/mock/result', { replace: true, viewTransition: true });
      }
    } finally {
      setBusy(false);
    }
  };

  const stopAndTranscribe = async () => {
    const blob = await rec.stop();
    try {
      const r = await recordingToText(blob, answered);
      setTranscript(r.text);
      if (r.demo) showToast('체험 모드: 대본 답변으로 받아썼어요');
    } catch (e) {
      showToast((e as Error).message);
      setTextMode(true);
    } finally {
      rec.finish();
    }
  };

  const end = () => {
    if (answered === 0) {
      nav('/mock', { viewTransition: true });
      return;
    }
    if (window.confirm('지금까지의 답변으로 결과를 볼까요?')) {
      stopSpeaking();
      nav('/mock/result', { replace: true, viewTransition: true });
    }
  };

  const title = `${setup.company ?? (setup.job ? setup.job : '자유')} ${setup.type} 면접`;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-[#ece9f6] via-[#f6f3fb] to-canvas">
      {/* 헤더 */}
      <header className="relative z-10 flex h-14 items-center px-4">
        <button type="button" aria-label="뒤로" onClick={() => nav('/mock/setup', { viewTransition: true })} className="press -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink">
          <Icon name="back" size={24} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-small font-semibold text-ink">{title}</p>
          <p className="text-caption tabular-nums text-muted">
            {number}/{QUESTION_COUNT}
          </p>
        </div>
        <button type="button" onClick={end} className="press flex min-h-[32px] items-center gap-1 rounded-full bg-danger/10 px-3 text-caption font-semibold text-danger">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          면접 종료
        </button>
      </header>

      {/* 면접관: 면접실 배경(public/mock/bg-portrait.jpg) 위에 정장 루다를 의자에 맞춰 올립니다.
          배경은 바닥(책상)을 기준으로 폭에 맞춰 깔고 위쪽(천장)이 잘립니다. 책상 부분을 한 번 더 그려 루다가 책상 뒤에 앉은 것처럼 보이게 합니다. */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0" style={{ aspectRatio: '840 / 1505', transform: 'translateY(9%)' }}>
          <img src={BG} alt="" draggable={false} className="h-full w-full select-none object-cover" />
          {/* 가운데 정렬은 감싸는 요소가 맡습니다. float 애니메이션이 transform 을 쓰므로 같은 요소에 두면 translate 가 덮입니다. */}
          <div className="absolute left-1/2 w-[68%] -translate-x-1/2" style={{ bottom: '19%' }}>
            <img src={`${import.meta.env.BASE_URL}char/suit-cutout.png`} alt="면접관 루다" draggable={false} className={`w-full select-none ${busy ? '' : 'float'}`} />
          </div>
          <img src={BG} alt="" draggable={false} aria-hidden="true" className="absolute inset-0 h-full w-full select-none object-cover" style={{ clipPath: 'inset(78.4% 0 0 0)' }} />
        </div>
        <button type="button" aria-label={muted ? '소리 켜기' : '소리 끄기'} onClick={() => { setMuted((m) => !m); stopSpeaking(); }} className="press absolute right-4 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-muted shadow-card">
          <Icon name={muted ? 'bell-off' : 'bell'} size={18} />
        </button>
      </div>

      {/* 질문 카드 + 답변 컨트롤 */}
      <div className="relative z-10 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="rise rounded-card bg-ink/90 px-5 py-4 text-surface shadow-pop" key={question}>
          {turns === null ? <div className="skeleton h-10 rounded-full opacity-30" /> : busy ? (
            <p className="flex items-center gap-2 text-[0.9375rem]">
              <Spinner /> 다음 질문을 준비하고 있어요
            </p>
          ) : (
            <p className="whitespace-pre-line text-[0.9375rem] font-medium leading-relaxed">{question}</p>
          )}
        </div>

        <div className="card mt-3 !p-4">
          {rec.error && <p className="mb-2 text-caption text-warn">{rec.error}</p>}
          {transcript !== null ? (
            <>
              <p className="text-caption font-semibold text-muted">받아쓴 답변 · 고친 뒤 보내도 돼요</p>
              <textarea className="field mt-2 min-h-[96px]" value={transcript} onChange={(e) => setTranscript(e.target.value)} aria-label="받아쓴 답변" />
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setTranscript(null)} className="btn-secondary px-4">
                  <Icon name="refresh" size={16} />
                  다시 녹음
                </button>
                <button type="button" onClick={() => void submitAnswer(transcript)} disabled={!transcript.trim() || busy} className="btn-primary flex-1">
                  답변 보내기
                  <Icon name="arrow-up" size={18} />
                </button>
              </div>
            </>
          ) : textMode ? (
            <>
              <textarea className="field min-h-[96px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="답변을 적어 주세요" aria-label="답변 입력" />
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setTextMode(false)} className="btn-secondary px-4">
                  <Icon name="mic" size={16} />
                  녹음으로
                </button>
                <button type="button" onClick={() => void submitAnswer(text)} disabled={!text.trim() || busy} className="btn-primary flex-1">
                  답변 보내기
                  <Icon name="arrow-up" size={18} />
                </button>
              </div>
            </>
          ) : rec.state === 'recording' ? (
            <div className="flex items-center gap-3">
              <div className="flex h-12 flex-1 items-center gap-[3px] overflow-hidden" aria-label="녹음 파형">
                {rec.levels.map((l, i) => (
                  <span key={i} className="w-1 rounded-full bg-primary transition-[height] duration-75" style={{ height: `${Math.max(8, l * 44)}px` }} />
                ))}
              </div>
              <button type="button" aria-label="녹음 멈추기" onClick={() => void stopAndTranscribe()} className="press flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lavender text-primary">
                <span className="h-5 w-5 rounded-[4px] bg-primary" />
              </button>
            </div>
          ) : rec.state === 'processing' ? (
            <div className="flex items-center justify-center gap-2 py-3 text-small text-muted">
              <Spinner /> 답변을 받아쓰는 중이에요
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button type="button" aria-label="답변 녹음 시작" onClick={() => void rec.start()} disabled={busy || turns === null} className="press flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(123,108,246,0.45)] disabled:opacity-40">
                <Icon name="mic" size={28} />
              </button>
              <p className="mt-2 text-caption tabular-nums text-muted">
                00:00 <span className="mx-1 text-line">|</span> {mmss(ANSWER_SECONDS)}
              </p>
            </div>
          )}
          {rec.state === 'recording' && (
            <p className="mt-2 text-center text-caption tabular-nums text-muted">답변 중... {mmss(rec.seconds)}</p>
          )}
          {rec.state === 'idle' && transcript === null && !textMode && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-caption text-muted">답변을 시작해주세요</p>
              <button type="button" onClick={() => setTextMode(true)} className="btn-ghost -mr-3 min-h-[32px] text-primary">
                글로 답하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
