import { Navigate, useNavigate } from 'react-router-dom';
import { ChatShell } from '../../components/ChatShell';
import { currentCategory, exploreMentions, getBuild } from '../../lib/build';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';

// 3~4. 선택한 경험 확인 및 진행, 꼬리 질문으로 구체화. card_ready 이벤트가 오면 카드 생성 화면으로 넘어갑니다.
export function BuildChat() {
  const nav = useNavigate();
  const build = getBuild();
  const category = currentCategory(build);
  if (!category) return <Navigate to="/profile/build/categories" replace />;
  const label = category === '봉사' ? '봉사활동' : category;
  // 직무 탐색에서 이미 이 분류 이야기를 했으면 그 문장을 이어받아, 같은 말을 다시 시키지 않습니다.
  const { data: mentions } = useAsync(async () => exploreMentions((await db.chatLogs.get('log:explore'))?.turns ?? [], category), [category]);
  if (mentions === undefined) return null;
  const opener = build.index === 0 ? `와! 다양한 경험을 했구나😊\n먼저 ${label} 경험부터\n정리해볼까?` : `좋아, 이번엔 ${label} 경험이야.`;
  const intro = mentions.length
    ? `${opener}\n직무 탐색 때 "${mentions[0]}"라고 했었지!\n그 이야기를 이어서 들려줘.\n언제, 어떤 역할로 했는지부터 알려 줘!`
    : `${opener}\n어떤 ${label}를 했는지\n자유롭게 이야기해줘!`;
  const progress = (build.index + 0.5) / Math.max(1, build.categories.length);
  const hint =
    `사용자가 고른 경험 분류: ${category} (${build.index + 1}/${build.categories.length}번째)` +
    (mentions.length ? `. 직무 탐색 대화에서 사용자가 이미 말한 내용: ${mentions.map((m) => `"${m}"`).join(', ')}. 이 내용은 다시 묻지 말고 기간·역할·어려움·배운 점만 물어볼 것.` : '');
  return (
    <ChatShell
      bot="interview"
      intro={intro}
      systemHint={hint}
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
