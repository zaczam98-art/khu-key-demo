import { useNavigate, useParams } from 'react-router-dom';
import { Character } from '../../components/Character';
import { Icon } from '../../components/Icon';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { vocative } from '../../lib/nudge';

// 면접 10. 합격 후 엔딩 (지원 건 단계가 "최종"이 되면 열 수 있습니다)
export function Celebrate() {
  const nav = useNavigate();
  const { appId = '' } = useParams();
  const { data } = useAsync(async () => ({ profile: await db.profile.get('me'), app: await db.applications.get(appId) }), [appId]);
  const name = data?.profile?.nickname ? vocative(data.profile.nickname) : '친구야';
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-gradient-to-b from-[#f7d9c4] via-[#e9c7e6] to-[#8f7fd9] px-5 pb-8 pt-[max(16px,env(safe-area-inset-top))]">
      {[...Array(10)].map((_, i) => (
        <Icon key={i} name="sparkle" size={8 + (i % 3) * 5} className="drift absolute text-white/80" style={{ left: `${8 + i * 9}%`, top: `${20 + (i % 4) * 15}%`, animationDelay: `${i * 0.35}s`, animationDuration: `${2.8 + (i % 3) * 0.6}s` }} />
      ))}
      <div className="flex justify-end">
        <button type="button" aria-label="닫기" onClick={() => nav(`/essay/${appId}`, { viewTransition: true })} className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/30 text-white">
          <Icon name="x" size={20} />
        </button>
      </div>
      <div className="rise mt-2 rounded-card bg-white/85 p-5 shadow-pop backdrop-blur">
        <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">{`${name}...\n정말 수고했어!\n너가 열심히 준비해온 만큼\n결과가 너무너무 기뻐! 💜\n이제 새로운 시작이야.\n언제든 또 이야기하고 싶다면\n여기에서 기다릴게.\n항상 네 곁에서 응원할게!`}</p>
        <p className="mt-2 text-right text-small text-muted">- 쿠키 -</p>
      </div>
      <div className="relative flex flex-1 items-end justify-center">
        <Character expr="heart" size={240} float />
      </div>
      <p className="rise mt-2 whitespace-pre-line text-center text-[1.0625rem] italic leading-relaxed text-white drop-shadow" style={{ animationDelay: '400ms' }}>
        {'지금까지,\n함께해서 행복했어.\n언제나 너의 곁에서.\n- 쿠키 -'}
      </p>
      {data?.app && <p className="mt-3 text-center text-caption text-white/80">{data.app.company} · {data.app.job} 최종 합격</p>}
      <button type="button" onClick={() => nav('/', { viewTransition: true })} className="btn-primary mt-4 w-full bg-ink/80">
        홈으로
      </button>
    </div>
  );
}
