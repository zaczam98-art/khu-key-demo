# 로드맵

2026-10-19 기준입니다. 단계 번호는 CLAUDE.md 11절과 다르며, 이 문서는 협업 순서를 적습니다.

## ChatKHU를 쓰는 곳

| 단계 | ChatKHU로 할 일 | 남는 증빙 |
|---|---|---|
| 문제정의 | 베이즈 채팅과 Deep Research로 취준생의 고민을 조사하고 문제 문장과 페르소나를 정리 | 대화 공유 링크, `docs/problem.md` |
| 자료준비 | 직무 사전 초안 생성, 캐릭터 표정 이미지 5장과 하트 장면 1장 생성, 시안 대화를 데모 JSON으로 정리 | `src/data/jobs.ts`, `public/char/*.png`, `server/demo/explore.json` |
| 기획설계 | 화면 흐름·데이터 모델·이벤트 규약 검토, 스튜디오 챗봇 지시문과 추출 프롬프트 초안 | `docs/decisions.md`, `docs/prompts.md` |
| 제작 | 스튜디오에서 "직무 탐색" 챗봇 생성, "API로 이 챗봇 호출하기" 켜기, API 키 발급 (사람이 화면에서) | 스튜디오 캡처, 챗봇 id(환경변수) |
| 개발 | 앱이 ChatKHU를 호출(대화는 챗봇 엔드포인트, 분석은 chat/completions JSON 스키마). Baze CLI로 게이트웨이 키를 써서 Claude Code나 Codex를 돌리면 개발 사용량도 ChatKHU에 남음 | `server/lib/chatkhu.ts`, `api/*`, 사용량 로그 |
| 테스트 | 테스트 페르소나 대화 5~10개를 생성해 챗봇에 돌리고 추출 JSON 통과율과 호출당 크레딧 측정 | `docs/test-log.md`, `/v1/gateway/usage/` 캡처 |
| 개선 | 실패 대화를 지시문과 프롬프트에 반영하고 이력 기록 | `docs/prompts.md` 변경 이력 |
| 최종결과물 | PWA가 ChatKHU 위에서 동작, 발표 슬라이드는 베이즈 프레젠테이션, 시연은 체험 모드로 네트워크 없이 재생 | 배포 URL, 영상, 서식4 |

## 구현 순서

| 순서 | 내용 | 완료 기준 | 상태 |
|---|---|---|---|
| 0 | CLAUDE.md, 시안, AGENTS.md, docs 뼈대, copy.md를 저장소에 넣기 | 문서만 보고 다른 AI가 시작할 수 있음 | 완료 |
| 1 | 뼈대: Tailwind, Router, 탭 5개, ChatShell, Dexie, 디자인 토큰 | 탭 이동, 새로고침 복원 | 완료 |
| 2 | 서버 층: `api/chat/[bot]`, `api/extract`, `server/lib/chatkhu`, 체험 모드 | 키 없이 `/api/chat/explore`가 대본을 돌려줌 | 완료 |
| 3 | 10화면을 시안과 맞추기 | 390px에서 시안과 나란히 놓고 차이 목록이 빈 상태 | 완료 (캐릭터는 자리표시) |
| 4 | 자료: 캐릭터 이미지, 직무 사전 30개를 ChatKHU로 생성 | 자리표시 이미지 전부 교체 | 대기 |
| 5 | 동료가 챗봇 id를 발급하면 환경변수에 넣고 실제 대화 테스트, 추출 프롬프트 다듬기 | id만 넣고 한 세션이 끝까지 진행 | 대기 |
| 6 | 데모 캐시와 증빙 묶음 정리 | 네트워크 없이 시연 재생 | 대기 |

## 작업 넘겨받는 법

1. `CLAUDE.md`와 `AGENTS.md`를 읽습니다.
2. `.env.example`을 `.env.local`로 복사합니다. 키가 없어도 체험 모드로 돌아갑니다.
3. `pnpm install` 뒤 `pnpm dev`로 띄우고 `/explore`부터 10화면을 한 번 끝까지 넘겨 봅니다.
4. 맡을 이슈를 고르고 브랜치를 만듭니다. 끝나면 `pnpm test`, `pnpm build`가 통과하는지 확인하고 PR을 엽니다.
