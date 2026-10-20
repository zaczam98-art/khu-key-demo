// 모의 면접 자체 채점 기준표 (CLAUDE.md 11절 5단계). 점수는 0~100 이고, 근거는 답변을 그대로 인용합니다.
export type RubricItem = { key: 'logic' | 'jobFit' | 'concreteness' | 'delivery'; label: string; question: string; levels: { score: number; desc: string }[] };

export const RUBRIC: RubricItem[] = [
  {
    key: 'logic',
    label: '논리',
    question: '주장, 이유, 사례가 순서대로 이어지는가',
    levels: [
      { score: 90, desc: '결론을 먼저 말하고 이유와 사례로 받친다. 질문에서 벗어나지 않는다.' },
      { score: 70, desc: '결론과 이유가 있지만 순서가 섞이거나 한 번 샛길로 빠진다.' },
      { score: 40, desc: '사례만 나열하거나 결론이 없다. 질문과 다른 답을 한다.' },
    ],
  },
  {
    key: 'jobFit',
    label: '직무 적합',
    question: '지원 직무가 필요로 하는 역량과 연결되는가',
    levels: [
      { score: 90, desc: '직무의 주요 업무를 알고 자신의 경험을 그 업무 언어로 바꿔 말한다.' },
      { score: 70, desc: '직무와 관련 있는 경험이지만 연결을 면접관이 추론해야 한다.' },
      { score: 40, desc: '직무와 무관한 경험이거나 직무를 잘못 이해하고 있다.' },
    ],
  },
  {
    key: 'concreteness',
    label: '구체성',
    question: '상황, 행동, 결과가 숫자나 고유한 사실로 드러나는가',
    levels: [
      { score: 90, desc: '언제, 어디서, 무엇을, 어떻게 했는지와 결과 수치나 변화가 있다.' },
      { score: 70, desc: '행동은 구체적이지만 결과가 "좋았다" 수준에 그친다.' },
      { score: 40, desc: '"열심히 했다", "소통했다" 같은 추상어만 있다.' },
    ],
  },
  {
    key: 'delivery',
    label: '전달력',
    question: '한 답변의 길이와 문장이 듣기에 알맞은가',
    levels: [
      { score: 90, desc: '한 답변이 3~6문장이고 문장이 짧다. 핵심 단어가 반복된다.' },
      { score: 70, desc: '조금 길거나 짧지만 이해에 지장이 없다.' },
      { score: 40, desc: '한 문장이 너무 길거나 답이 한 줄로 끝난다.' },
    ],
  },
];

export const INTERVIEW_TYPES = ['실무', '임원', 'PT', 'AI화상'] as const;
export const INTERVIEW_TYPE_DESC: Record<(typeof INTERVIEW_TYPES)[number], string> = {
  실무: '직무 경험과 문제 해결을 깊게 묻는 면접',
  임원: '가치관, 태도, 회사 이해를 묻는 면접',
  PT: '주제를 받고 구조적으로 발표하는 면접',
  AI화상: '정해진 질문에 혼자 답하는 녹화형 면접',
};

export function rubricText(): string {
  return RUBRIC.map((r) => `${r.label}(${r.key}): ${r.question}\n` + r.levels.map((l) => `  - ${l.score}점 수준: ${l.desc}`).join('\n')).join('\n');
}
