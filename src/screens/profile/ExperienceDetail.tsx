import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExperienceForm } from '../../components/ExperienceForm';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState } from '../../components/ui';
import { db, type Experience } from '../../lib/db';
import { periodLabel } from '../../lib/experience';
import type { ExperienceCard } from '../../lib/schema';
import { useAppStore } from '../../store';

// 저장된 경험 카드 보기·고치기·지우기
export function ExperienceDetail() {
  const nav = useNavigate();
  const { id = '' } = useParams();
  const showToast = useAppStore((s) => s.showToast);
  const [card, setCard] = useState<Experience | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ExperienceCard | null>(null);

  useEffect(() => {
    db.experiences.get(id).then((c) => setCard(c ?? null));
  }, [id]);

  const startEdit = () => {
    if (!card) return;
    setDraft({ title: card.title, category: card.category, period: card.period, role: card.role, activities: card.activities, achievements: card.achievements, learned: card.learned, skills: card.skills, missing: card.missing });
    setEditing(true);
  };
  const saveEdit = async () => {
    if (!card || !draft) return;
    const next = { ...card, ...draft };
    await db.experiences.put(next);
    setCard(next);
    setEditing(false);
    showToast('고쳤어요');
  };
  const remove = async () => {
    if (!card || !window.confirm('이 경험 카드를 지울까요?')) return;
    await db.experiences.delete(card.id);
    showToast('카드를 지웠어요');
    nav('/profile', { replace: true, viewTransition: true });
  };

  if (card === undefined) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (card === null) return <div className="p-4"><EmptyState expr="think" title="카드를 찾을 수 없어" action={{ label: '프로필로', to: '/profile' }} /></div>;

  const Section = ({ title, items }: { title: string; items: string[] }) =>
    items.length ? (
      <section className="mt-5">
        <h3 className="section-title">{title}</h3>
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2 text-[0.875rem] leading-relaxed text-ink">
              <Icon name="check" size={16} className="mt-1 shrink-0 text-primary" strokeWidth={2.5} />
              {it}
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader
        title="경험 카드"
        right={
          !editing ? (
            <button type="button" aria-label="고치기" onClick={startEdit} className="press flex h-11 w-11 items-center justify-center rounded-full text-ink">
              <Icon name="edit" size={20} />
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 px-4 pb-8 pt-2">
        {editing && draft ? (
          <>
            <div className="card">
              <ExperienceForm value={draft} onChange={setDraft} />
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">
                취소
              </button>
              <button type="button" onClick={() => void saveEdit()} className="btn-primary flex-1">
                <Icon name="check" size={18} />
                저장
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rise flex items-center gap-2">
              <Badge tone="soft">{card.category}</Badge>
              <span className="text-caption text-muted">{periodLabel(card.period)}</span>
            </div>
            <h2 className="rise mt-2 text-title text-ink" style={{ animationDelay: '60ms' }}>
              {card.title}
            </h2>
            <p className="rise mt-1 text-small text-muted" style={{ animationDelay: '120ms' }}>
              {card.role}
            </p>
            {card.skills.length > 0 && (
              <div className="rise mt-3 flex flex-wrap gap-1.5" style={{ animationDelay: '180ms' }}>
                {card.skills.map((s) => (
                  <span key={s} className="tag">
                    #{s}
                  </span>
                ))}
              </div>
            )}
            <div className="rise" style={{ animationDelay: '240ms' }}>
              <Section title="주요 활동" items={card.activities} />
              <Section title="성과" items={card.achievements} />
              <Section title="배운 점" items={card.learned} />
            </div>
            {card.missing.length > 0 && (
              <div className="rise mt-5 rounded-card bg-lavender px-4 py-3 text-small text-ink" style={{ animationDelay: '300ms' }}>
                <p className="font-semibold text-primary">채우면 더 좋은 것</p>
                {card.missing.map((m) => (
                  <p key={m}>· {m}</p>
                ))}
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => void remove()} className="btn-ghost text-danger">
                <Icon name="trash" size={16} />
                지우기
              </button>
              <button type="button" onClick={() => nav('/essay', { viewTransition: true })} className="btn-primary flex-1">
                이 카드로 자소서 쓰기
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
