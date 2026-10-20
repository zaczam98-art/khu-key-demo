import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { ExperienceForm } from '../../components/ExperienceForm';
import { Icon } from '../../components/Icon';
import { Spinner } from '../../components/ui';
import { extractExperience, toMsgs } from '../../lib/api';
import { currentCategory, getBuild, hasNext, setBuild } from '../../lib/build';
import { db } from '../../lib/db';
import { periodLabel } from '../../lib/experience';
import { nowIso, uid } from '../../lib/ids';
import type { ExperienceCard } from '../../lib/schema';
import { useAppStore } from '../../store';
import { BuildHeader } from './BuildIntro';

// 5. 경험 카드 생성. 대화를 카드로 정리해 보여 주고, 고쳐서 저장합니다. 남은 분류가 있으면 다음 인터뷰로 갑니다.
export function BuildReview() {
  const nav = useNavigate();
  const build = getBuild();
  const category = currentCategory(build);
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const [card, setCard] = useState<ExperienceCard | null>(null);
  const [editing, setEditing] = useState(false);
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
        setCard(category ? { ...r.result, category } : r.result);
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
    await db.experiences.add({ ...card, id: uid(), sourceTurns, confirmed: true, createdAt: nowIso() });
    await db.chatLogs.delete('log:interview');
    setSaving(false);
    showToast('경험 카드를 저장했어요 💜');
    if (hasNext(build)) {
      setBuild({ ...build, index: build.index + 1 });
      nav('/profile/build/chat', { replace: true, viewTransition: true });
    } else {
      nav('/profile/build/more', { replace: true, viewTransition: true });
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <BuildHeader step={3} back="/profile/build/chat" />
      <div className="flex-1 px-4 pb-8 pt-1">
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
              <div className="bubble-bot">{'이렇게 정리했어!\n맞는지 확인해줘.'}</div>
            </div>
            {editing ? (
              <div className="card rise mt-4">
                <ExperienceForm value={card} onChange={setCard} />
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary mt-4 w-full">
                  <Icon name="check" size={18} />
                  수정 끝
                </button>
              </div>
            ) : (
              <div className="card rise mt-4" style={{ animationDelay: '120ms' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-heading text-ink">{card.title}</h2>
                    <p className="mt-0.5 text-small text-muted">{periodLabel(card.period)}</p>
                  </div>
                  <button type="button" onClick={() => setEditing(true)} className="btn-ghost -mr-3 min-h-[36px] text-primary">
                    수정하기
                  </button>
                </div>
                {card.role && <p className="mt-2 text-small text-ink">{card.role}</p>}
                {([['주요 활동', card.activities], ['성과', card.achievements]] as [string, string[]][]).map(([label, items]) =>
                  items.length ? (
                    <section key={label} className="mt-4">
                      <h3 className="text-small font-semibold text-muted">{label}</h3>
                      <ul className="mt-1.5 space-y-1">
                        {items.map((it) => (
                          <li key={it} className="flex items-start gap-2 text-[0.875rem] text-ink">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null,
                )}
                {card.learned.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-small font-semibold text-muted">배운 점</h3>
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink">{card.learned.join(' ')}</p>
                  </section>
                )}
                {card.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {card.skills.map((s) => (
                      <span key={s} className="tag">
                        #{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setEditing((v) => !v)} className="btn-secondary flex-1">
                {editing ? '카드로 보기' : '수정하기'}
              </button>
              <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner /> : null}
                저장하기
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
