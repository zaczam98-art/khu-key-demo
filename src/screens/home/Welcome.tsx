import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';
import { db } from '../../lib/db';
import { nowIso } from '../../lib/ids';
import { mask } from '../../lib/mask';

export const ONBOARDED_KEY = 'khu-onboarded';

// 처음 열었을 때 한 번. 닉네임만 받습니다(실명·학번·연락처는 받지 않음, CLAUDE.md 5절).
export function Welcome() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const nickname = mask(name.trim()).slice(0, 12);
    const now = nowIso();
    const current = await db.profile.get('me');
    await db.profile.put({
      id: 'me',
      targetJobs: current?.targetJobs ?? [],
      strengths: current?.strengths ?? [],
      exploreKeywords: current?.exploreKeywords ?? [],
      createdAt: current?.createdAt ?? now,
      ...current,
      nickname: nickname || current?.nickname,
      updatedAt: now,
    });
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      // 무시
    }
    nav('/', { replace: true });
  };

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-lavender via-canvas to-canvas px-6 pb-8 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="flex flex-1 items-center justify-center">
        <Character expr="default" size={220} float />
      </div>
      <form onSubmit={finish} className="card rise">
        <h1 className="text-title text-ink">안녕! 나는 루다야 👋</h1>
        <p className="mt-2 text-body text-muted">너를 뭐라고 부르면 좋을까? 닉네임만 알려 줘. 실명이나 연락처는 묻지 않아.</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 쿠키러버"
          maxLength={12}
          autoComplete="nickname"
          className="field mt-4"
        />
        <button type="submit" disabled={busy} className="btn-primary mt-4 w-full">
          {name.trim() ? `${name.trim()}(으)로 시작하기` : '닉네임 없이 시작하기'}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </div>
  );
}

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true;
  }
}
