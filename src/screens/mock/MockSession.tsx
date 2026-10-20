import { useNavigate } from 'react-router-dom';
import { ChatShell } from '../../components/ChatShell';
import { db } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { MOCK_SETUP_KEY, type MockSetup } from './MockHub';

export function readMockSetup(): MockSetup {
  try {
    const raw = localStorage.getItem(MOCK_SETUP_KEY);
    if (raw) return JSON.parse(raw) as MockSetup;
  } catch {
    // 무시
  }
  return { type: '실무' };
}

// 면접 세션. 면접관(persona)이 묻고, 4번째 답을 받으면 score 이벤트로 결과 화면으로 넘어갑니다.
export function MockSession() {
  const nav = useNavigate();
  const setup = readMockSetup();
  const { data: hint } = useAsync(async () => {
    const cards = await db.experiences.toArray();
    const summary = cards.slice(0, 5).map((c) => `${c.title}(${c.skills.join(', ')})`).join(' / ');
    return [`면접 유형: ${setup.type}`, setup.company ? `지원 회사: ${setup.company}` : '', setup.job ? `지원 직무: ${setup.job}` : '', summary ? `지원자의 경험 카드: ${summary}` : ''].filter(Boolean).join('\n');
  }, []);
  const intro = `안녕하세요, 오늘 ${setup.type} 면접을 맡은 면접관입니다.\n긴장 풀고 편하게 답해 주세요.\n먼저, 가장 자신 있는 경험 하나를 소개해 주세요.`;
  return (
    <ChatShell
      bot="mock"
      intro={intro}
      systemHint={hint}
      back="/mock"
      maxTurns={5}
      persona={{ name: '면접관', expr: 'suit' }}
      finishChip="면접 마치고 결과 보기"
      finishEvent="score"
      onEvent={(event) => {
        if (event.type === 'score') nav('/mock/result', { viewTransition: true });
      }}
    />
  );
}
