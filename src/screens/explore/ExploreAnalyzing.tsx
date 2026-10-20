import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { ChatHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { extract, toMsgs } from '../../lib/api';
import { db } from '../../lib/db';
import { useAppStore } from '../../store';

// 6. 대화 기반 분석 중. 체크 애니메이션은 응답을 기다리는 동안 순서대로 켜지고, 마지막은 응답이 와야 끝납니다.
const STEPS = ['대화 내용 분석 중...', '흥미와 가치관 파악', '강점 키워드 도출', '적합 직무 분석 중'];
const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ExploreAnalyzing() {
  const nav = useNavigate();
  const setResult = useAppStore((s) => s.setResult);
  const note = useAppStore((s) => s.note);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStep(0);
    setError(null);
    const timer = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    (async () => {
      const log = await db.chatLogs.get('log:explore');
      try {
        const reply = await extract(toMsgs(log?.turns ?? []));
        if (!alive) return;
        window.clearInterval(timer);
        note(reply.demo, reply.credits);
        setResult(reply.result);
        setStep(STEPS.length);
        window.setTimeout(() => {
          if (alive) nav('/explore/summary');
        }, 800);
      } catch (e) {
        if (!alive) return;
        window.clearInterval(timer);
        setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [attempt, nav, note, setResult]);

  const done = Math.min(step, STEPS.length);
  const ratio = error ? 0 : done / STEPS.length;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <ChatHeader expr="think" back="/explore/chat" />
      <div className="flex flex-1 flex-col items-center px-6 pt-6">
        <div className="relative flex h-[136px] w-[136px] items-center justify-center">
          <svg width="136" height="136" viewBox="0 0 136 136" className="absolute inset-0 -rotate-90">
            <circle cx="68" cy="68" r={RADIUS} fill="none" stroke="#EEEBFF" strokeWidth="8" />
            <circle
              cx="68"
              cy="68"
              r={RADIUS}
              fill="none"
              stroke="#7B6CF6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <Character expr="think" size={96} float />
          <span className="pop absolute -right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-warn/15 text-warn">
            <Icon name="bulb" size={22} />
          </span>
        </div>
        <p className="mt-2 text-[12px] font-semibold tabular-nums text-primary">{Math.round(ratio * 100)}%</p>
        <h1 className="mt-2 whitespace-pre-line text-center text-[18px] font-semibold leading-snug text-ink">
          {'지금까지의 대화를 바탕으로\n너의 특징을 정리하고 있어!'}
        </h1>
        <div className="card rise mt-6 w-full space-y-3">
          {STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step && !error ? 'active' : 'todo';
            return (
              <div key={label} className={`flex items-center gap-3 text-[14px] transition-colors ${state === 'todo' ? 'text-muted/70' : 'text-ink'}`}>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                    state === 'done' ? 'pop border-primary bg-primary text-white' : state === 'active' ? 'animate-pulse border-primary' : 'border-lavender'
                  }`}
                >
                  {state === 'done' && <Icon name="check" size={14} />}
                  {state === 'active' && <span className="spin h-3 w-3 rounded-full border-2 border-primary border-t-transparent" />}
                </span>
                {label}
              </div>
            );
          })}
        </div>
        {error && (
          <div className="rise mt-6 w-full text-center">
            <p className="text-[14px] text-warn">{error}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-primary mt-3 w-full">
              <Icon name="refresh" size={18} />
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
