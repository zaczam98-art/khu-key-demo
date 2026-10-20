import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChatShell } from '../../components/ChatShell';

// 경험 카드 2. 경험 인터뷰. 쿠키가 하나씩 묻고, 충분하면 card_ready 이벤트로 정리 화면으로 넘어갑니다.
export function ExperienceChat() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const category = params.get('category') ?? '기타';
  const intro = `좋아, ${category} 경험 이야기해 보자!\n언제, 어떤 규모였고\n너는 어떤 역할이었어?`;
  return (
    <ChatShell
      bot="interview"
      intro={intro}
      systemHint={`사용자가 고른 경험 분류: ${category}`}
      back="/profile/experience/new"
      maxTurns={7}
      finishChip="지금까지 내용으로 카드 만들기"
      finishEvent="card_ready"
      onEvent={(event) => {
        if (event.type === 'card_ready') nav(`/profile/experience/review?category=${encodeURIComponent(category)}`, { viewTransition: true });
      }}
    />
  );
}
