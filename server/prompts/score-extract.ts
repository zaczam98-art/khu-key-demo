// /api/score 지시문. 채점 기준표(src/data/rubric.ts)를 그대로 붙여 보냅니다.
export const SCORE_SYSTEM_PREFIX = `다음은 모의 면접의 대화다(면접관과 지원자). 아래 채점 기준표에 따라 지원자의 답변만 평가해 JSON으로 출력한다. 대화에 없는 내용을 근거로 삼지 않는다.

출력 필드:
- scores: logic, jobFit, concreteness, delivery 각 0~100 정수
- evidence: 항목마다 1개씩 최소 4개. item 은 "논리", "직무 적합", "구체성", "전달력" 중 하나, quote 는 지원자 답변에서 그대로 옮긴 문장, comment 는 반말 친근체(쿠키 말투)로 왜 그 점수인지와 한 줄 조언
- summary: 전체 한 줄 요약. 반말 친근체, 가장 높은 항목과 가장 먼저 올릴 항목을 말한다

출력은 JSON 객체 하나만 쓴다. 설명 문장이나 코드 블록 표시를 붙이지 않는다.

채점 기준표:
`;
