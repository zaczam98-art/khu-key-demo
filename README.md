# KHU:KEY (쿠키)

[![CI](https://github.com/zaczam98-art/khu-key-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/zaczam98-art/khu-key-demo/actions/workflows/ci.yml)
[![Deploy](https://github.com/zaczam98-art/khu-key-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/zaczam98-art/khu-key-demo/actions/workflows/deploy.yml)

2026 KHU AI Challenge 출품작 "쿠키"의 코드입니다. 쿠키는 취업 준비생에게 먼저 질문을 던져 경험을 끌어내고, 그 결과를 직무 탐색·경험 카드·자소서·일정·면접까지 이어서 쓰는 AI 커리어 메이트입니다. 쿠키가 하는 말과 판단은 모두 ChatKHU에서 오고, 이 저장소는 화면(PWA), 저장(IndexedDB), 서버 중계(Vercel Functions)를 담당합니다.

작업 가이드는 `CLAUDE.md`, 협업 규칙은 `AGENTS.md`, 진행 순서는 `docs/roadmap.md`에 있습니다.

## 지금 상태 (2026-10-26)

- 실제 배포 주소(챗봇 연결됨): https://khu-key-demo-three.vercel.app/ (Vercel 프로덕션 도메인. https://khu-key-demo-khukey.vercel.app/ 도 같은 곳. 팀 계정 khukey, main 푸시마다 자동 배포). 체험 모드 전용 주소: https://zaczam98-art.github.io/khu-key-demo/ (GitHub Pages, 서버 없음).

- 2026-10-27: 캐릭터 자리표시 이미지 6장을 팀 시트의 실제 그림으로 바꿨습니다.
- 2026-10-26: 홈 배지가 첫 대화 전에도 실제 연결 여부를 보여 줍니다(`GET /api/health`, 크레딧 소모 없음).
- 2026-10-23 1차 자체 점검: 분류별 체험 카드 9종, 모듈별 늦은 불러오기(첫 로딩 JS 37KB + vendor), 링크 공유 미리보기 메타, 한국어 줄바꿈, 여러 줄 채팅 입력. 자세한 내용은 `docs/decisions.md`.
- 시안 4장(`design/`)의 40화면이 모두 들어 있습니다. 직무 탐색 10화면, 프로필 구축 10화면(분류 복수 선택 → 인터뷰 → 카드 → 종합 분석 → 미리보기), 자소서 10화면(대화 시작 → 공고 분석 → 경험 매칭·보완 → 초안·첨삭 탭 → 제출 → 다음 단계), 면접 10화면(4갈래 시작 → 설정 → 음성 세션 → 결과 → 상세 피드백 → 합격 엔딩), 그리고 홈·일정·알림.
- ChatKHU 키와 챗봇 id가 없으면 전부 체험 모드로 돌아갑니다. 대화는 `server/demo/*.json` 대본, 추출·초안·채점·분석은 같은 파일의 예시 결과로 재생되고, 추천 답변이 칩으로 나와 타자 없이 넘길 수 있습니다. 면접의 받아쓰기도 대본 답변으로 대체되고, 질문 읽어 주기는 브라우저 음성으로 됩니다.
- 디자인: CSS 변수 토큰(밝게·어둡게), 글자 6단계, Lucide 아이콘, 모션 토큰, 화면 전환(View Transitions), 데스크톱 폰 프레임, 첫 진입 닉네임, 공유 카드, 공용 토스트·시트·빈 상태.
- 체험 모드 배포: https://zaczam98-art.github.io/khu-key-demo/ (서버 없음, main에 합쳐지면 자동 배포)
- 캐릭터 이미지 6장은 팀 시트(`design/05_캐릭터_표정.png`, 표정 15종)에서 잘라 넣었습니다. 다른 표정이 필요하면 같은 시트에서 같은 방식(원형, 512px)으로 잘라 `public/char/`에 추가합니다. 비어 있는 자리는 `.env.local`의 ChatKHU 키·챗봇 id 4개뿐입니다(배포 환경에는 들어가 있음).

## 실행

Node 20 이상, pnpm이 필요합니다.

```bash
pnpm install
cp .env.example .env.local   # 키가 없어도 됩니다
pnpm dev                     # 같은 와이파이의 폰에서는 터미널에 찍힌 Network 주소로 접속
```

상위 폴더 이름에 `;`가 있으면 `pnpm dev`가 vite를 못 찾을 수 있습니다. 그때는 `node node_modules/vite/bin/vite.js --host`로 직접 실행합니다.

```bash
pnpm test     # 규칙 함수·직무 사전·D-day·선제 메시지·경험 추천 테스트 (vitest)
pnpm build    # tsc 검사 + vite 빌드
```

처음 열면 닉네임 화면이 나옵니다. 프로필 > 설정에서 테마, 알림, "데이터 모두 지우고 처음부터"를 쓸 수 있습니다.

## ChatKHU 연결

`.env.local`에 키 하나와 챗봇 id를 넣으면 실제 모드로 바뀝니다. 발급 방법은 `.env.example`과 `docs/chatkhu-api.md`에 있습니다.

```
CHATKHU_API_KEY=            # API Gateway 화면에서 발급한 키
CHATKHU_BOT_EXPLORE=        # 직무 탐색 챗봇 id
CHATKHU_BOT_INTERVIEW=      # 경험 인터뷰 챗봇 id
CHATKHU_BOT_ESSAY=          # 자소서 시작 대화 챗봇 id
CHATKHU_BOT_MOCK=           # 면접관 챗봇 id
```

챗봇 id가 비어 있으면 키만으로 일반 모델에 `server/prompts/`의 지시문을 붙여 대화합니다. 스튜디오 챗봇에 넣을 지시문과 이벤트 규약은 `docs/prompts.md`에 있습니다. 브라우저 코드에는 키가 들어가지 않고, 호출은 전부 `server/lib/chatkhu.ts`를 거칩니다. 면접의 STT·TTS 요청 형식은 OpenAI 호환으로 가정했고 키를 받은 뒤 실측해 `docs/chatkhu-api.md`에 적습니다.

## 협업

- 할 일은 GitHub 이슈 "작업" 양식으로 적습니다(라벨 `ai-ready`). 이슈 1개 = 브랜치 1개 = PR 1개입니다.
- PR을 열면 `ci.yml`이 테스트와 빌드를 돌리고, main에 합쳐지면 `deploy.yml`이 Pages에 올립니다.
- 결정은 `docs/decisions.md`에, 지시문 변경은 `docs/prompts.md`에 덧붙입니다. 화면 문구는 `design/copy.md`가 기준입니다.

## 배포

- GitHub Pages: `.github/workflows/deploy.yml`이 main 푸시마다 `VITE_BASE=/khu-key-demo/`로 빌드해 올립니다. 서버가 없으므로 체험 모드입니다.
- Vercel: 저장소를 연결하고 환경변수(`CHATKHU_*`, 선택으로 `KV_*`, `VAPID_*`)를 넣으면 `api/`가 서버 함수로 올라가 실제 모드가 됩니다. `vercel.json`에 SPA 재작성 규칙이 있습니다.
- Vercel 은 `api/*.ts` 를 Node ESM 으로 돌리므로 api·server 의 상대 import 는 `.js` 확장자를 붙이고, JSON 은 `createRequire` 로 읽습니다. 안 지키면 함수가 FUNCTION_INVOCATION_FAILED 로 죽습니다(docs/decisions.md 2026-10-25).

## 폴더

```
api/            Vercel Functions: health, chat/[bot], extract, extract-experience, analyze-profile, extract-post, essay-draft, score, job-post, stt, tts, push
server/         lib/chatkhu.ts(호출 한 곳), prompts/(지시문 10종), demo/(체험 대본 4종), dev-api.ts(로컬 /api)
src/components  ChatShell, Character, Header, TabBar, Icon(Lucide), ui, Toast, InstallBanner, SettingsSheet, ExperienceForm, Splash
src/screens     home(홈·일정·닉네임), explore(10화면), profile(구축 마법사 10화면 + 카드 상세), essay(시작·목록·추가·상세·문항·다음 단계), mock(시작·설정·세션·결과·상세·기록·엔딩)
src/lib         db, schema, api, mask, events, dday, nudge, experience, essay, build, profile, push, voice, wav, theme, shareCard, hooks
src/data        jobs.ts 직무 사전 30개, rubric.ts 면접 채점 기준표
design/         시안 PNG 4장, 캐릭터 표정 시트 1장, copy.md
docs/           chatkhu-api.md, prompts.md, decisions.md, roadmap.md
.github/        이슈·PR 템플릿, ci.yml(PR 검사), deploy.yml(Pages)
```
