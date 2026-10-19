# KHU:KEY (쿠키)

2026 KHU AI Challenge 출품작 "쿠키"의 코드입니다. 쿠키는 취업 준비생에게 먼저 질문을 던져 경험을 끌어내고, 그 결과를 직무 탐색·자소서·면접까지 이어서 쓰는 AI 커리어 메이트입니다. 쿠키가 하는 말과 판단은 모두 ChatKHU에서 오고, 이 저장소는 화면(PWA), 저장(IndexedDB), 서버 중계(Vercel Functions)를 담당합니다.

작업 가이드는 `CLAUDE.md`, 협업 규칙은 `AGENTS.md`, 진행 순서는 `docs/roadmap.md`에 있습니다.

## 지금 상태 (2026-10-19)

- 0단계 뼈대와 1단계 직무 탐색 10화면이 끝났습니다. 시안은 `design/01_직무탐색.png`, 문구는 `design/copy.md`입니다.
- ChatKHU 키와 챗봇 id가 없으면 체험 모드로 돌아갑니다. 시안의 대화가 그대로 재생되고 추천 답변이 칩으로 나옵니다.
- 체험 모드 배포: https://zaczam98-art.github.io/khu-key-demo/ (서버 없음, main에 합쳐지면 자동 배포)
- 캐릭터 이미지는 자리표시입니다. `public/char/{default,smile,think,wink,suit,heart}.png`를 같은 이름으로 바꿔 끼우면 됩니다.

## 실행

Node 20 이상, pnpm이 필요합니다.

```bash
pnpm install
cp .env.example .env.local   # 키가 없어도 됩니다
pnpm dev                     # 같은 와이파이의 폰에서는 터미널에 찍힌 Network 주소로 접속
```

상위 폴더 이름에 `;`가 있으면 `pnpm dev`가 vite를 못 찾을 수 있습니다. 그때는 `node node_modules/vite/bin/vite.js --host`로 직접 실행합니다.

```bash
pnpm test     # 규칙 함수 테스트 (vitest)
pnpm build    # tsc 검사 + vite 빌드
```

## ChatKHU 연결

`.env.local`에 아래 둘만 넣으면 실제 대화와 분석이 ChatKHU로 갑니다. 발급 방법은 `.env.example`과 `docs/chatkhu-api.md`에 있습니다.

```
CHATKHU_API_KEY=       # API Gateway 화면에서 발급한 키
CHATKHU_BOT_EXPLORE=   # 스튜디오 "직무 탐색" 챗봇 id (비우면 일반 모델 + 쿠키 지시문으로 대화)
```

브라우저 코드에는 키가 들어가지 않습니다. 호출은 전부 `server/lib/chatkhu.ts`를 거칩니다.

## 배포

- GitHub Pages: `.github/workflows/deploy.yml`이 main 푸시마다 `VITE_BASE=/khu-key-demo/`로 빌드해 올립니다. 서버가 없으므로 체험 모드입니다.
- Vercel: 저장소를 연결하고 환경변수(`CHATKHU_*`)를 넣으면 `api/`가 서버 함수로 올라가 실제 모드가 됩니다. `vercel.json`에 SPA 재작성 규칙이 있습니다.

## 폴더

```
api/            Vercel Functions: chat/[bot].ts, extract.ts
server/         lib/chatkhu.ts(호출 한 곳), prompts/(지시문), demo/(체험 대본), dev-api.ts(로컬 /api)
src/components  ChatShell, Character, Header, TabBar, Icon
src/screens     home, explore(10화면), profile, essay, mock
src/lib         db(Dexie), mask, events, schema(zod), api, profile
src/data        jobs.ts 직무 사전
design/         시안 PNG, copy.md
docs/           chatkhu-api.md, prompts.md, decisions.md, roadmap.md
```
