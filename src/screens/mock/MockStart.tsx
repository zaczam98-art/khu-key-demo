import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon, type IconName } from '../../components/Icon';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { vocative } from '../../lib/nudge';

// 면접 1. 면접 시작 (자유 대화) (design/04_면접.png 1번)
export function MockStart() {
  const nav = useNavigate();
  const { data } = useAsync(async () => ({ profile: await db.profile.get('me'), sessions: await db.mockSessions.count() }), []);
  const call = data?.profile?.nickname ? `안녕! ${vocative(data.profile.nickname)}` : '안녕!';
  const options: { icon: IconName; label: string; mode: string }[] = [
    { icon: 'building', label: '지원한 기업으로 연습하기', mode: 'app' },
    { icon: 'briefcase', label: '직무 유형으로 연습하기', mode: 'job' },
    { icon: 'doc', label: '이력서/자소서 기반 맞춤 연습', mode: 'essay' },
    { icon: 'message', label: '자유롭게 연습하기', mode: 'free' },
  ];
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-lavender via-canvas to-canvas">
      <TitleHeader
        title="쿠키 AI 면접"
        back="/"
        close
        right={
          data?.sessions ? (
            <Link to="/mock/history" viewTransition className="btn-ghost -mr-3 min-h-[36px] text-primary">
              기록 {data.sessions}
            </Link>
          ) : null
        }
      />
      <div className="relative flex items-center justify-center px-6 py-2">
        <Icon name="sparkle" size={22} className="pop absolute right-[16%] top-[18%] text-primary/60" style={{ animationDelay: '0.4s' }} />
        <Character expr="suit" size={210} float />
      </div>
      <div className="flex-1 px-4 pb-8">
        <div className="card rise bg-ink/90 !text-surface">
          <p className="whitespace-pre-line text-body leading-relaxed text-surface">{`${call}\n오늘은 어떤 면접을 준비해볼까?\n부담 갖지 말고 편하게 말해줘.\n내가 너의 면접 메이트가 되어줄게! 💜`}</p>
        </div>
        <ul className="mt-4 space-y-2">
          {options.map((o, i) => (
            <li key={o.mode}>
              <button type="button" onClick={() => nav(`/mock/setup?mode=${o.mode}`, { viewTransition: true })} className="card rise press flex w-full items-center gap-3 !p-4 text-left" style={{ animationDelay: `${150 + i * 70}ms` }}>
                <span className="tile h-10 w-10 bg-lavender text-primary">
                  <Icon name={o.icon} size={20} />
                </span>
                <span className="flex-1 text-[0.875rem] font-medium text-ink">{o.label}</span>
                <Icon name="chevron" size={18} className="text-muted/60" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
