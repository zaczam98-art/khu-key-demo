# AGENTS.md

이 저장소에서 작업하는 모든 AI 도구(Claude Code, Codex, 베이즈 등)와 사람은 먼저 `CLAUDE.md`를 읽습니다. 제품 설명, 기술 스택, 데이터 모델, 화면 사양이 거기에 있습니다. 이 문서는 협업 규칙만 적습니다.

## 작업 규칙

- 작업 단위는 GitHub 이슈 1개 = 브랜치 1개 = PR 1개입니다. 이슈 "작업" 양식(라벨 `ai-ready`)에 "완료 기준"과 "건드릴 파일"을 적습니다. 두 작업이 같은 파일을 동시에 고치지 않습니다.
- PR을 열면 `ci.yml`이 테스트와 빌드를 돌립니다. `main`에 합쳐지면 GitHub Pages(https://zaczam98-art.github.io/khu-key-demo/)에 자동 배포됩니다. Pages에는 서버가 없으므로 체험 모드로 돌아갑니다.
- `.env.local`은 커밋하지 않습니다. ChatKHU 키와 챗봇 id는 환경변수(`.env.example` 참고)에만 둡니다. 브라우저 코드에서 ChatKHU를 직접 호출하지 않습니다.
- ChatKHU 호출은 `server/lib/chatkhu.ts` 한 곳만 거칩니다. 새 구조화 출력을 추가할 때는 `src/lib/schema.ts`에 zod 스키마와 JSON 스키마를 짝으로 만들고, `server/demo/*.json`에 체험 응답을 넣습니다.
- 시안은 `design/01_직무탐색.png`, `02_프로필구축.png`, `03_자소서.png`, `04_면접.png`이고, 화면 문구는 `design/copy.md`가 기준입니다. 앱 이름은 "쿠키", 챗봇·캐릭터 이름은 "루다"입니다(2026-10-25 결정, CLAUDE.md 8절).
- 결정은 `docs/decisions.md`에 날짜와 함께 덧붙이기만 하고, 지시문 변경은 `docs/prompts.md`에 기록합니다.
- PR 전에 `pnpm test`와 `pnpm build`가 통과해야 합니다.
- 상위 폴더 이름에 `;`가 있으면 `pnpm run` 스크립트가 `tsc`, `vite`를 못 찾을 수 있습니다. 그때는 `node node_modules/vite/bin/vite.js build`처럼 직접 실행합니다.
