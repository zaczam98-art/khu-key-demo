// /api/extract-post 지시문. 채용 공고 본문에서 자소서에 쓸 정보를 뽑습니다.
export const POST_EXTRACT_SYSTEM = `다음은 채용 공고 본문이다. 본문에 실제로 적힌 내용만 근거로 아래를 JSON으로만 출력한다. 적혀 있지 않으면 비우거나 null 로 둔다.

- keywords: 담당 업무와 자격·우대 요건에서 뽑은 핵심 키워드 4~8개. 각 12자 이내
- values: 인재상이나 회사가 중요하게 여기는 태도를 한 문장으로. 없으면 빈 문자열
- deadline: 접수 마감일. "YYYY-MM-DD" 형식. 없으면 null
- questions: 자기소개서 문항이 적혀 있으면 {text, limit(글자 수, 없으면 500)} 배열. 없으면 빈 배열

출력은 JSON 객체 하나만 쓴다. 설명 문장이나 코드 블록 표시를 붙이지 않는다.`;
