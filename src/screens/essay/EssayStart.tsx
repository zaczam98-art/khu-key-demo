import { ChatShell } from '../../components/ChatShell';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { vocative } from '../../lib/nudge';

// 자소서 1. 작성 시작 (자유 대화). 칩은 화면을 열고, 입력은 쿠키와 대화합니다. (design/03_자소서.png 1번)
export function EssayStart() {
  const { data } = useAsync(async () => {
    const [profile, apps] = await Promise.all([db.profile.get('me'), db.applications.count()]);
    return { nickname: profile?.nickname, apps };
  }, []);
  const call = data?.nickname ? `${vocative(data.nickname)}!` : '안녕!';
  const intro = `${call}\n자소서 써볼까? 👋\n\n너가 지원하려는 기업이나\n직무가 있으면 알려줘!\n아직 정하지 않았으면\n괜찮아. 내가 공고도\n함께 찾아줄게!`;
  const actions = [
    { label: 'A기업 마케팅 직무 자소서 써보고 싶어', to: '/essay/new?company=A%EA%B8%B0%EC%97%85&job=%EB%A7%88%EC%BC%80%ED%8C%85%20%EA%B8%B0%ED%9A%8D%EC%9E%90' },
    { label: '공고링크만 받았는데 준비 중이야', to: '/essay/new?focus=link' },
    { label: '아직 정하지 않았는데 추천해줘', to: '/explore' },
    { label: data?.apps ? `이전에 써둔 자소서 수정하고 싶어 (${data.apps}건)` : '이전에 써둔 자소서 수정하고 싶어', to: '/essay/list' },
  ];
  if (data === undefined) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  return <ChatShell bot="essay" intro={intro} title="쿠키 💜" noBack quickActions={actions} maxTurns={99} />;
}
