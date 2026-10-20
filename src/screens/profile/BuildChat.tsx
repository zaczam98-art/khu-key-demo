import { Navigate, useNavigate } from 'react-router-dom';
import { ChatShell } from '../../components/ChatShell';
import { currentCategory, getBuild } from '../../lib/build';

// 3~4. 선택한 경험 확인 및 진행, 꼬리 질문으로 구체화. card_ready 이벤트가 오면 카드 생성 화면으로 넘어갑니다.
export function BuildChat() {
  const nav = useNavigate();
  const build = getBuild();
  const category = currentCategory(build);
  if (!category) return <Navigate to="/profile/build/categories" replace />;
  const label = category === '봉사' ? '봉사활동' : category;
  const intro =
    build.index === 0
      ? `와! 다양한 경험을 했구나😊\n먼저 ${label} 경험부터\n정리해볼까?\n어떤 ${label}를 했는지\n자유롭게 이야기해줘!`
      : `좋아, 이번엔 ${label} 경험이야.\n어떤 ${label}를 했는지\n자유롭게 이야기해줘!`;
  const progress = (build.index + 0.5) / Math.max(1, build.categories.length);
  return (
    <ChatShell
      bot="interview"
      intro={intro}
      systemHint={`사용자가 고른 경험 분류: ${category} (${build.index + 1}/${build.categories.length}번째)`}
      back="/profile/build/categories"
      progress={progress}
      maxTurns={6}
      finishChip="지금까지 내용으로 카드 만들기"
      finishEvent="card_ready"
      onEvent={(event) => {
        if (event.type === 'card_ready') nav('/profile/build/review', { viewTransition: true });
      }}
    />
  );
}
