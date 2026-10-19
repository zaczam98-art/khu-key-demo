import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { db } from '../../lib/db';
import { useAppStore } from '../../store';

// 1. 직무 탐색 시작
export function ExploreStart() {
  const nav = useNavigate();
  const resetExplore = useAppStore((s) => s.resetExplore);
  const [hasLog, setHasLog] = useState(false);

  useEffect(() => {
    db.chatLogs.get('log:explore').then((log) => setHasLog((log?.turns.length ?? 0) > 1));
  }, []);

  const restart = async () => {
    await db.chatLogs.delete('log:explore');
    resetExplore();
    nav('/explore/chat');
  };

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-lavender via-canvas to-canvas px-5 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="flex justify-end">
        <Link to="/profile" className="rounded-full bg-white/80 px-3 py-1 text-[13px] text-muted shadow-card">
          건너뛰기
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center py-6">
        <Character expr="smile" size={240} />
      </div>
      <div className="card text-center">
        <h1 className="text-[22px] font-bold text-ink">안녕! 나는 쿠키야 👋</h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{'너와 함께 딱 맞는 직무를\n찾아볼게.\n편하게 이야기해줘!'}</p>
        <button type="button" onClick={() => nav('/explore/chat')} className="btn-primary mt-6 w-full">
          직무 탐색 시작하기 →
        </button>
        {hasLog && (
          <button type="button" onClick={() => void restart()} className="mt-3 text-[13px] text-muted underline">
            대화 기록을 지우고 새로 시작
          </button>
        )}
      </div>
    </div>
  );
}
