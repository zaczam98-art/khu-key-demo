// /api/score 지시문. 채점 기준표(src/data/rubric.ts)를 그대로 붙여 보냅니다. (design/04_면접.png 8~9번)
export const SCORE_SYSTEM_PREFIX = `다음은 모의 면접의 대화다(면접관과 지원자). 아래 채점 기준표에 따라 지원자의 답변만 평가해 JSON으로 출력한다. 대화에 없는 내용을 근거로 삼지 않는다.

출력 필드:
- scores: logic(논리력), jobFit(직무 이해도), concreteness(경험 구체성), delivery(소통력) 각 0~100 정수
- evidence: 항목마다 1개씩 4개. item 은 "논리력", "직무 이해도", "경험 구체성", "소통력" 중 하나, quote 는 지원자 답변에서 그대로 옮긴 문장, comment 는 반말 친근체(쿠키 말투)로 왜 그 점수인지와 한 줄 조언
- summary: 전반적인 평가 2~3문장. 반말 친근체. 좋았던 점 하나와 가장 먼저 올릴 점 하나
- perQuestion: 질문마다 하나씩. n(순서), title(질문 요지 10자 이내), score(0~100), good(좋았던 점 1~2개), improve(개선하면 좋은 점 1~2개), suggest(추천 답변 방향 2~3개, 명사구), model(그 질문에 대한 모범 답안 3~4문장, 지원자가 말한 사실만 사용)

출력은 JSON 객체 하나만 쓴다. 설명 문장이나 코드 블록 표시를 붙이지 않는다.

채점 기준표:
`;
