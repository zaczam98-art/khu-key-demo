import { useNavigate, useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon, type IconName } from '../../components/Icon';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { vocative } from '../../lib/nudge';

// 자소서 10. 추가 활용 및 다음 단계
export function EssayDone() {
  const nav = useNavigate();
  const { id = '' } = useParams();
  const { data } = useAsync(async () => ({ profile: await db.profile.get('me'), app: await db.applications.get(id) }), [id]);
  const call = data?.profile?.nickname ? ` ${vocative(data.profile.nickname)}` : '';
  const actions: { icon: IconName; label: string; to: string }[] = [
    { icon: 'mic', label: '이 자소서로 예상 면접 질문 연습하기', to: `/mock/setup?app=${id}&mode=essay` },
    { icon: 'doc', label: '다른 기업 자소서도 작성하기', to: '/essay/new' },
    { icon: 'history', label: '자소서 버전 비교하기', to: `/essay/${id}` },
    { icon: 'calendar-plus', label: '취업 일정에 추가하기', to: '/schedule' },
  ];
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-lavender via-canvas to-canvas">
      <TitleHeader title="" back={`/essay/${id}`} />
      <div className="relative flex items-center justify-center py-2">
        <Icon name="sparkle" size={20} className="pop absolute left-[20%] top-[10%] text-primary/60" style={{ animationDelay: '0.3s' }} />
        <Icon name="sparkle" size={14} className="pop absolute right-[22%] top-[60%] text-warn/70" style={{ animationDelay: '0.7s' }} />
        <Character expr="done" size={200} float />
      </div>
      <div className="flex-1 px-4 pb-8">
        <div className="card rise">
          <p className="whitespace-pre-line text-body leading-relaxed text-ink">{`완성이야! 너무 잘 썼어${call}! 🎉\n이 경험은 면접에서도 활용할 수 있어.\n이 자소서를 바탕으로 예상 면접 질문을\n준비해볼까?`}</p>
        </div>
        <ul className="mt-4 space-y-2">
          {actions.map((a, i) => (
            <li key={a.label}>
              <button type="button" onClick={() => nav(a.to, { viewTransition: true })} className="card rise press flex w-full items-center gap-3 !p-4 text-left" style={{ animationDelay: `${150 + i * 70}ms` }}>
                <span className="tile h-10 w-10 bg-lavender text-primary">
                  <Icon name={a.icon} size={20} />
                </span>
                <span className="flex-1 text-[0.875rem] font-medium text-ink">{a.label}</span>
                <Icon name="chevron" size={18} className="text-muted/60" />
              </button>
            </li>
          ))}
        </ul>
        {data?.app && <p className="mt-4 text-center text-caption text-muted">{data.app.company} · {data.app.job}</p>}
      </div>
    </div>
  );
}
