# KHU:KEY (쿠키) Claude Code 작업 가이드

이 저장소는 2026 KHU AI Challenge(경희대, AI 문제해결 솔루션 부문) 출품작 "KHU:KEY(쿠키)"의 코드입니다. 이 문서를 먼저 읽고, 아래 "지금 할 일"부터 시작합니다. 문서와 다른 판단을 해야 하면 먼저 묻습니다.

## 1. 제품 한 줄

쿠키는 취업 준비생에게 먼저 질문을 던져 흩어진 경험을 끌어내고, 그 경험을 "경험 카드"로 저장해 직무 탐색·자소서·일정·면접까지 이어서 쓰는 AI 커리어 메이트입니다. 사용자가 무엇을 물어야 할지 모르는 순간부터 쿠키가 개입합니다.

## 2. 전체 구조

```
폰 브라우저 (PWA, 홈 화면 추가)        우리 서버 (Vercel Functions)        ChatKHU
├ 화면 40개 (모듈 5개)               ├ /api/chat/:bot   챗봇 중계        ├ 스튜디오 챗봇 4개
├ 공용 채팅 컴포넌트 1개      ──►     ├ /api/extract     JSON 추출  ──►  ├ 게이트웨이 모델 호출
├ IndexedDB (내 데이터)              ├ /api/job-post    공고 긁기         ├ STT / TTS
└ 웹 푸시 구독                        ├ /api/push        알림 발송         └ 이미지 생성(제작용)
                                      └ API 키·일일 상한·데모 모드
```

- 쿠키가 하는 모든 말과 판단은 ChatKHU에서 옵니다. 우리는 껍데기(화면), 기억(저장), 규칙(날짜·정렬·채점 기준표)을 만듭니다.
- 모듈 5개: 홈·일정 / 직무 탐색 / 프로필 구축(경험 카드) / 자소서 / 면접. 디자인 시안은 `design/` 폴더의 PNG 4장이 기준이며 그 화면 구성과 문구를 그대로 따릅니다.

## 3. 기술 스택 (바꾸지 않음)

- 프런트: Vite + React 18 + TypeScript, Tailwind CSS, React Router, Zustand(화면 상태), Dexie(IndexedDB).
- PWA: vite-plugin-pwa (manifest, service worker, 홈 화면 추가, 웹 푸시).
- 서버: Vercel Serverless Functions (`/api/*.ts`), Vercel KV(사용량 카운터·푸시 구독).
- ChatKHU 호출은 서버에서만. 브라우저 코드에 API 키가 들어가면 안 됩니다.
- 패키지 매니저 pnpm. 테스트는 vitest(규칙 함수만).

## 4. ChatKHU 연동 규약

환경변수(.env.local, 절대 커밋 금지):
```
CHATKHU_API_KEY_A=...        # 계정 1 키 (대화형 챗봇)
CHATKHU_API_KEY_B=...        # 계정 2 키 (JSON 추출·자소서)
CHATKHU_API_KEY_C=...        # 계정 3 키 (면접·음성)
CHATKHU_BASE=https://factchat-cloud.mindlogic.ai/v1/gateway
CHATKHU_BOT_EXPLORE=<스튜디오 챗봇 id: 직무 탐색>
CHATKHU_BOT_INTERVIEW=<id: 경험 인터뷰>
CHATKHU_BOT_ESSAY=<id: 자소서>
CHATKHU_BOT_MOCK=<id: 면접관>
DAILY_CREDIT_CAP=550
```

호출 두 종류:
1. 대화형: `POST {BASE}/chatbots/{id}/chat/completions/` (OpenAI 호환 messages 형식). 지시문은 스튜디오 챗봇이 가지고 있으므로 user/assistant 메시지만 보냅니다. 최근 N턴만 보냅니다(모듈별로 명시).
2. 구조화 출력: `POST {BASE}/chat/completions/` 에 `model`(기본 `claude-sonnet-5-5`)과 system 메시지(JSON 스키마 포함)를 직접 보냅니다. 응답은 반드시 JSON.parse 후 zod로 검증하고, 실패하면 1회 재시도 뒤 "다시 시도" 안내.

첫 작업에서 반드시 할 것: 공식 문서 https://docs.mindlogic.ai/docs/khu/ 에서 (가) 스튜디오 챗봇 API의 정확한 요청·응답 형식, (나) 응답에 토큰 사용량(usage)이 포함되는지, (다) 헤더가 `Authorization: Bearer`인지 `x-api-key`인지를 확인하고 `docs/chatkhu-api.md`에 적은 뒤 코드를 씁니다. 추측으로 쓰지 않습니다.

서버 공통 규칙:
- 모든 호출은 `lib/chatkhu.ts` 한 곳을 거칩니다. 여기서 키 선택, 호출, usage 기록(KV: 날짜별 크레딧 합계, 익명 ID별 횟수), 일일 상한 검사, 실패 시 데모 응답 반환을 처리합니다.
- 크레딧 추정: 입력 토큰×입력 단가 + 출력 토큰×출력 단가(1K 토큰당, Sonnet 2/10, Haiku 1/5, Gemini 3.8 Flash 0.75/3.75). usage가 없으면 글자 수÷2로 근사.
- 상한을 넘으면 `{demo:true, ...}`로 미리 저장한 응답(`server/demo/*.json`)을 돌려주고 화면에 "체험 모드" 표시.

## 5. 데이터 모델 (Dexie 테이블)

```ts
Profile      { id:'me', nickname?, grade?, major?, targetJobs: {name, source:'explore'|'manual', confidence:'상'|'중'|'하', reason}[], strengths: string[], exploreKeywords: string[], createdAt, updatedAt }
Experience   { id, title, category:'동아리'|'학회'|'학생회'|'봉사'|'아르바이트'|'인턴십'|'공모전'|'자격증·교육'|'기타', period:{from,to}, role, activities:string[], achievements:string[], learned:string[], skills:string[], sourceTurns:number[], missing:string[], confirmed:boolean, createdAt }
Application  { id, company, job, postUrl?, postText?, keywords:string[], values?:string, deadline?, stage:'관심'|'작성중'|'제출'|'서류합격'|'서류불합격'|'면접'|'최종', questions:{qid, text, limit, expIds:string[], status, versions:{ver, body, model, createdAt}[], feedback?}[], checklist:{item, done}[] }
Task         { id, appId?, type:'자소서'|'서류제출'|'인적성'|'면접'|'기타', title, dueAt, estMin, done, priority:number, lastNudgedAt? }
MockSession  { id, appId?, mode:'text'|'voice', type:'실무'|'임원'|'PT'|'AI화상', turns:{n, kind:'기본'|'꼬리', q, basis, a, audioSec?}[], scores:{logic, jobFit, concreteness, delivery}, evidence:{item, quote, comment}[], createdAt }
ChatLog      { id, module, turns:{role, content, at}[] }   // 화면 복원용, 서버로 안 보냄
```

- 실명·학번·전화·이메일 필드는 두지 않습니다. 닉네임만 받습니다.
- 서버로 보내기 전에 `lib/mask.ts`가 전화·이메일·학번 형식을 지웁니다.

## 6. 공용 채팅 컴포넌트 (모든 대화 화면이 이것 하나를 씁니다)

`components/ChatShell.tsx`
- props: `bot`(explore|interview|essay|mock), `systemHint?`(화면별 추가 문맥, 예: 선택한 카테고리), `quickReplies?`(선택지 버튼 배열), `onEvent`(모델 응답 안에 포함된 이벤트 처리), `maxTurns?`, `progress?`(상단 진행 바).
- 디자인: 왼쪽 캐릭터 아바타 + 연보라 말풍선(쿠키), 오른쪽 진보라 말풍선(사용자), 하단 입력창 `+` 버튼과 전송 버튼, 선택지는 말풍선 아래 칩 형태. 시안의 "9:41" 상태바 영역은 실제 기기 safe-area로 대체.
- 로딩 중에는 "..." 말풍선과 캐릭터 표정 '생각 중'.
- 응답 끝에 `<<EVENT:{"type":"summary_ready"}>>` 같은 태그가 오면 화면 전환 이벤트로 처리하고 말풍선에는 보이지 않게 합니다(스튜디오 챗봇 지시문에 같은 규약을 넣습니다).
- 대화 로그는 ChatLog에 저장해 새로고침해도 복원.

캐릭터 표정: `public/char/{default,smile,think,wink,suit}.png`. 팀원이 주기 전까지는 같은 크기의 자리표시 이미지를 둡니다.

## 7. 디자인 토큰 (시안 기준)

- 주색 보라 `#7B6CF6`(버튼·사용자 말풍선), 연보라 배경 `#EEEBFF`(쿠키 말풍선·카드), 바탕 `#F7F6FB`, 글자 `#222`, 보조 글자 `#6B6B80`, 성공 초록 `#2FB270`, 경고 주황 `#F0A030`.
- 둥근 모서리 16~20px, 카드 그림자 아주 약하게, 글꼴 Pretendard(없으면 시스템 산세리프).
- 하단 탭 5개: 홈, 직무 탐색, 프로필, 자소서, 면접.
- 모든 화면은 390px 폭 기준으로 만들고 데스크톱에서는 가운데 420px 틀 안에 보이게.
- 상단 제목은 시안의 번호 없이 화면 이름만.

## 8. 글쓰기 규칙 (화면 문구)

- 쿠키 말투는 시안 그대로 반말·친근체("안녕! 나는 쿠키야"). 시스템 안내 문구(버튼, 오류)는 짧은 해요체.
- 앱 이름은 "쿠키", 챗봇·캐릭터 이름은 "루다"입니다(2026-10-25 결정). 말풍선·헤더·"루다가 발견한" 같은 화자 자리는 루다, 앱 제목·매니페스트·공유 제목은 쿠키입니다. 시안의 "루미"는 루다로 바꿉니다.
- 이모지는 시안에 있는 자리에만 최소로.
- "먼저 연락한다"는 표현 대신 "앱을 열면 쿠키가 먼저 말해요".

## 9. 금지·주의

- 브라우저에서 ChatKHU 직접 호출 금지.
- 실명·학번·연락처 저장·전송 금지.
- 채용 사이트 로그인 우회·대량 수집 금지(공고 긁기는 사용자가 넣은 링크 1건만, 실패 시 붙여넣기).
- 날짜 계산·우선순위·D-day는 LLM에 맡기지 않고 코드로.
- 음성 녹음은 wav(16kHz mono)로 변환해 보냄(webm 거부됨). 5단계 전까지는 손대지 않음.
- 라이브러리 버전은 고정하고, 큰 구조 변경 전에는 묻습니다.

## 10. 기록 (서식4 증빙)

- `docs/prompts.md`: ChatKHU에 보내는 지시문과 바꾼 이력(날짜, 모델, 요지, 바꾼 이유).
- `docs/decisions.md`: 채택한 안과 버린 안(날짜 포함).
- `docs/chatkhu-api.md`: 확인한 API 형식과 실측 usage.

## 11. 개발 순서

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| 0 뼈대 | PWA, 탭 5개, ChatShell, Dexie, `/api/chat`, `lib/chatkhu.ts`, 데모 모드 | 더미 챗봇과 한 번 대화되고 새로고침 후 복원 |
| **1 직무 탐색** | **아래 12절 화면 10개** | **시안 10화면이 끝까지 돌아가고 결과가 Profile에 저장됨** |
| 2 프로필 구축 | 경험 카드 10화면 | 카드 3개 저장, 종합 분석 표시 |
| 3 자소서 | 10화면 + 공고 긁기 | 지원 건 1개 문항 3개 완성 |
| 4 홈·일정·알림 | 선제 메시지, D-day, 웹 푸시 | 지원 건 2개로 홈 메시지 확인 |
| 5 면접(텍스트) | 10화면 + 자체 채점 기준표 | 한 세션 끝까지, 점수마다 근거 인용 |
| 6 면접(음성) | 녹음·STT·TTS | 음성으로 한 세션 |
| 7 마무리 | 데모 캐시, 체험 코드, 영상 | 네트워크 없이 시연 재생 |

이번 작업은 0단계와 1단계입니다. 1단계가 끝나면 멈추고 보고합니다. 2단계부터는 1단계에서 만든 ChatShell·저장·API 틀을 그대로 재사용합니다.

## 12. 1단계 상세: 직무 탐색 10화면 (`design/01_직무탐색.png` 기준)

라우트 `/explore/*`. 쿠키 챗봇은 `CHATKHU_BOT_EXPLORE`. 서버로 보내는 대화는 최근 8턴.

| # | 화면 | 구현 |
|---|---|---|
| 1 | 직무 탐색 시작 | 캐릭터 큰 이미지, "안녕! 나는 쿠키야", 설명 2줄, 버튼 "직무 탐색 시작하기 →", 우상단 "건너뛰기"(프로필로 이동) |
| 2 | 자유 대화 시작 | ChatShell. 첫 쿠키 메시지는 고정 문구(시안 2번 첫 말풍선)로 서버 호출 없이 표시. 사용자 입력부터 챗봇 호출 |
| 3~4 | 대화 이어짐 | ChatShell 그대로. 쿠키가 경험을 되묻고 업무 스타일 보기를 제시(챗봇 지시문이 담당). 사용자 메시지 4개가 쌓이면 챗봇이 5번으로 넘어가는 이벤트를 냄 |
| 5 | 추가 질문 및 심층 탐색 | 쿠키가 번호 질문 3개를 한 말풍선에 냄. 사용자는 한 번에 답하거나 나눠 답함. 답이 끝나면 `<<EVENT:{"type":"analyze"}>>` |
| 6 | 대화 기반 분석 중 | 전체 대화를 `/api/extract`(Sonnet, JSON)로 보냄. 화면은 4단계 체크 애니메이션(대화 내용 분석, 흥미·가치관 파악, 강점 키워드 도출, 적합 직무 분석)을 실제 응답 대기 시간 동안 순서대로 켬 |
| 7 | 탐색 결과 요약 | 키워드 칩 5개 내외 + "이런 성향을 가진 것 같아!" 문장 4개. 데이터: `{keywords:string[], traits:string[], jobs:{name, summary, tags, why}[]}` |
| 8 | 추천 직무 결과 | 직무 카드 3개(아이콘·이름·한 줄·태그). 버튼 "이 결과를 내 프로필에 저장하기 →" |
| 9 | 직무 상세 | 카드 탭하면 상세: 어떤 일을 하나요, 주요 업무 4개, 이런 사람에게 잘 맞아요 2개. 내용은 `data/jobs.ts`의 직무 사전(처음엔 10개, 팀원이 30개로 확장)에서 가져오고, 사전에 없는 직무는 추출 JSON의 설명으로 대체. 버튼 "관심 직무로 저장", "관련 직무 더 보기" |
| 10 | 프로필 저장 완료 | Profile.targetJobs에 저장(source:'explore'), exploreKeywords·strengths 갱신. 캐릭터 하트 이미지, "탐색 결과가 내 프로필에 저장됐어!", 버튼 "다음 단계로 이동하기 →"(프로필 구축으로), 링크 "나중에 할게요"(홈) |

`/api/extract` 지시문 요지(실제 문장은 `server/prompts/explore-extract.ts`에 두고 docs/prompts.md에도 기록):
"다음은 취업 준비생과 메이트의 대화다. 대화에 실제로 나온 내용만 근거로 (1) 흥미·강점 키워드 4~6개, (2) 성향 문장 4개(각 40자 이내, '~을 좋아함' 형태), (3) 추천 직무 3개(이름, 한 줄 설명, 태그 3~4개, 추천 이유 1문장)를 JSON으로만 출력한다. 대화에 없는 사실을 만들지 않는다."

스튜디오 챗봇(직무 탐색) 지시문 요지(팀원이 스튜디오에 넣음, 코드에는 없음): 반말 친근체, 한 번에 질문 하나, 사용자가 든 경험에서 "어떤 부분이 좋았는지"를 되묻기, 사용자 메시지 4개 뒤에 업무 스타일 선택지 3개 제시, 그다음 번호 질문 3개, 답을 받으면 `<<EVENT:{"type":"analyze"}>>`를 마지막 줄에 붙이기.

데모 모드: `server/demo/explore.json`에 시안 대화(마케팅 기획자 결과)를 그대로 넣어 두고, 키가 없거나 상한 초과 시 이 대화로 재생되게 합니다. 발표장 시연도 이 모드로 할 수 있어야 합니다.

## 13. 지금 할 일 (이 순서대로)

1. 공식 문서에서 4절의 (가)(나)(다)를 확인해 `docs/chatkhu-api.md` 작성.
2. 프로젝트 생성(Vite+React+TS+Tailwind+PWA), 폴더: `src/components`, `src/screens/{home,explore,profile,essay,mock}`, `src/lib`, `src/data`, `api/`, `server/prompts`, `server/demo`, `docs/`, `design/`.
3. Dexie 스키마(5절), `lib/mask.ts`, `lib/chatkhu.ts`(서버), `/api/chat/[bot].ts`, `/api/extract.ts`, 데모 모드.
4. ChatShell 컴포넌트와 디자인 토큰.
5. 직무 탐색 10화면(12절).
6. `pnpm dev`로 폰 브라우저에서 확인할 수 있게 로컬 네트워크 주소 출력, Vercel 배포 1회.
7. 끝나면 `docs/decisions.md`에 이번 단계에서 정한 것과 미룬 것을 적고 보고.

막히면 임시 우회 코드를 넣지 말고 어디서 막혔는지 적고 멈춥니다.
