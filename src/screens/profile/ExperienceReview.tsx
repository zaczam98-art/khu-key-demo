import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { ExperienceForm } from '../../components/ExperienceForm';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Spinner } from '../../components/ui';
import { extractExperience, toMsgs } from '../../lib/api';
import { db } from '../../lib/db';
import { nowIso, uid } from '../../lib/ids';
import type { ExperienceCard } from '../../lib/schema';
import { useAppStore } from '../../store';

// 경험 카드 3. 대화를 카드로 정리해 보여 주고, 고쳐서 저장합니다.
export function ExperienceReview() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const category = params.get('category') ?? undefined;
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const [card, setCard] = useState<ExperienceCard | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sourceTurns, setSourceTurns] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    setError(null);
    setCard(null);
    (async () => {
      const log = await db.chatLogs.get('log:interview');
      const turns = log?.turns ?? [];
      setSourceTurns(turns.map((t, i) => (t.role === 'user' ? i : -1)).filter((i) => i >= 0));
      try {
        const r = await extractExperience(toMsgs(turns), category);
        if (!alive) return;
        note(r.demo, r.credits);
        setCard(r.result);
        setMissing(r.result.missing);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt, category, note]);

  const save = async () => {
    if (!card || !card.title.trim()) {
      showToast('제목을 적어 줘');
      return;
    }
    setSaving(true);
    const id = uid();
    await db.experiences.add({ ...card, id, sourceTurns, confirmed: true, createdAt: nowIso() });
    await db.chatLogs.delete('log:interview');
    setSaving(false);
    showToast('경험 카드를 저장했어요 💜');
    nav(`/profile/experience/${id}`, { replace: true, viewTransition: true });
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="카드 정리" back="/profile/experience/chat" />
      <div className="flex-1 px-4 pb-8 pt-2">
        {!card && !error && (
          <div className="flex flex-col items-center py-10">
            <Character expr="think" size={120} float />
            <p className="mt-4 text-body text-ink">이야기한 내용을 카드로 정리하는 중이야</p>
            <div className="mt-4 w-full space-y-2">
              <div className="skeleton h-5 w-2/3 rounded-full" />
              <div className="skeleton h-4 w-full rounded-full" />
              <div className="skeleton h-4 w-5/6 rounded-full" />
            </div>
          </div>
        )}
        {error && (
          <div className="rise mt-6 text-center">
            <p className="text-[0.875rem] text-warn">{error}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-primary mt-3 w-full">
              <Icon name="refresh" size={18} />
              다시 시도
            </button>
          </div>
        )}
        {card && (
          <>
            <div className="rise flex items-start gap-3">
              <Character expr="smile" size={48} className="shrink-0 rounded-full bg-lavender" />
              <div className="bubble-bot">{'이렇게 정리해 봤어.\n틀린 곳은 바로 고쳐 줘!'}</div>
            </div>
            {missing.length > 0 && (
              <div className="rise mt-4 rounded-card border border-warn/40 bg-warn/10 px-4 py-3" style={{ animationDelay: '100ms' }}>
                <p className="flex items-center gap-1 text-small font-semibold text-warn">
                  <Icon name="bulb" size={16} />
                  쿠키가 더 묻고 싶은 것
                </p>
                <ul className="mt-1.5 space-y-1 text-small text-ink">
                  {missing.map((m) => (
                    <li key={m}>· {m}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="card rise mt-4" style={{ animationDelay: '160ms' }}>
              <ExperienceForm value={card} onChange={setCard} />
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => nav('/profile/experience/chat' + (category ? `?category=${encodeURIComponent(category)}` : ''), { viewTransition: true })} className="btn-secondary flex-1">
                더 이야기하기
              </button>
              <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner /> : <Icon name="check" size={18} />}
                카드 저장
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
