import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon, type IconName } from '../../components/Icon';
import { Spinner } from '../../components/ui';
import { analyzeProfile } from '../../lib/api';
import { db } from '../../lib/db';
import { nowIso } from '../../lib/ids';
import type { ProfileAnalysis } from '../../lib/schema';
import { useAppStore } from '../../store';
import { BuildHeader } from './BuildIntro';

// 7. AI가 경험 종합 분석
const ICONS: IconName[] = ['briefcase', 'target', 'people', 'award', 'sparkle'];

export function BuildAnalysis() {
  const nav = useNavigate();
  const note = useAppStore((s) => s.note);
  const showToast = useAppStore((s) => s.showToast);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    setAnalysis(null);
    (async () => {
      const cards = await db.experiences.toArray();
      if (!cards.length) {
        nav('/profile/build/categories', { replace: true });
        return;
      }
      try {
        const r = await analyzeProfile(cards.map((c) => ({ title: c.title, category: c.category, role: c.role, activities: c.activities, achievements: c.achievements, learned: c.learned, skills: c.skills })));
        if (!alive) return;
        note(r.demo, r.credits);
        setAnalysis(r.result);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt, nav, note]);

  const save = async () => {
    if (!analysis) return;
    setSaving(true);
    const now = nowIso();
    const current = await db.profile.get('me');
    await db.profile.put({
      id: 'me',
      targetJobs: current?.targetJobs ?? [],
      exploreKeywords: current?.exploreKeywords ?? [],
      createdAt: current?.createdAt ?? now,
      ...current,
      strengths: analysis.strengths.map((s) => s.title),
      strengthDetails: analysis.strengths,
      updatedAt: now,
    });
    setSaving(false);
    showToast('프로필에 저장했어요 💜');
    nav('/profile/build/preview', { viewTransition: true });
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <BuildHeader step={4} back="/profile/build/more" />
      <div className="flex-1 px-4 pb-8 pt-1">
        <div className="rise flex items-start gap-3">
          <Character expr={analysis ? 'smile' : 'think'} size={48} className="shrink-0 rounded-full bg-lavender" />
          <div className="bubble-bot">{analysis ? '지금까지 이야기한 경험들을\n바탕으로 루다가 너의 강점과 특성을\n정리해봤어!' : '경험 카드들을 모아서\n강점을 정리하는 중이야...'}</div>
        </div>
        {!analysis && !error && (
          <div className="card mt-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-tile" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2 rounded-full" />
                  <div className="skeleton h-3 w-full rounded-full" />
                </div>
              </div>
            ))}
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
        {analysis && (
          <section className="card rise mt-5" style={{ animationDelay: '120ms' }}>
            <h2 className="section-title">루다의 분석 결과</h2>
            <ul className="mt-3 space-y-3">
              {analysis.strengths.map((s, i) => (
                <li key={s.title} className="rise flex items-start gap-3" style={{ animationDelay: `${200 + i * 90}ms` }}>
                  <span className="tile h-10 w-10 bg-lavender text-primary">
                    <Icon name={ICONS[i % ICONS.length]} size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body font-semibold text-ink">{s.title}</span>
                    <span className="block text-small text-muted">{s.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="sticky bottom-0 bg-canvas/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => void save()} disabled={!analysis || saving} className="btn-primary w-full">
          {saving ? <Spinner /> : null}
          프로필에 저장하기
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
