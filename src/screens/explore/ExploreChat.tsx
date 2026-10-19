import { useNavigate } from 'react-router-dom';
import { ChatShell } from '../../components/ChatShell';

// 2~5. 자유 대화 시작부터 심층 탐색까지. 첫 말풍선은 고정 문구이고 서버 호출이 없습니다. (CLAUDE.md 12절)
export const EXPLORE_INTRO = '안녕! 만나서 반가워 🥰\n우선 가볍게 이야기해보자!\n지금 취업 준비하면서\n가장 고민되는 게 뭐야?';

export function ExploreChat() {
  const nav = useNavigate();
  return (
    <ChatShell
      bot="explore"
      intro={EXPLORE_INTRO}
      back="/explore"
      maxTurns={9}
      onEvent={(event) => {
        if (event.type === 'analyze') nav('/explore/analyzing');
      }}
    />
  );
}
