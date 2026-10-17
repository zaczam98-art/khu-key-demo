# KHU:KEY — 쿠키와 직무 탐색 데모

경희대학교 교내 AI 경진대회 제출을 위한 **프론트엔드 데모 프로토타입**입니다. 첨부 시안의 직무 탐색 10단계 흐름을 모바일 우선 UI로 구성했습니다.

> 이 저장소는 데모 전용입니다. 실제 LLM/API 호출, 챗봇 시스템 프롬프트, 챗봇 ID, 사용자 계정, 서버 저장 기능은 포함하지 않습니다. 대화·분석 결과는 화면 시연용 예시입니다.

## 데모 범위

- 시작 화면과 쿠키 캐릭터
- 직무 탐색 대화 흐름과 스타일 선택
- 분석 중 애니메이션 및 키워드 요약
- 직무 추천 3개, 직무 상세, 프로필 저장 완료 화면
- Zustand 상태 유지, IndexedDB(Dexie) 데모 프로필 저장
- Vite PWA 기본 manifest/service worker 설정
- 데모 상태는 브라우저에 저장되며, 민감한 실제 개인정보를 입력하지 마세요.

## 로컬 실행

필요 조건: Node.js 20 이상 권장

```bash
npm install
npm run dev
```

Vite가 출력하는 로컬 주소를 브라우저에서 엽니다.

프로덕션 빌드 확인:

```bash
npm run build
npm run preview
```

## GitHub에 올리기

```bash
git init
git add .
git commit -m "Initial KHU:KEY career demo"
git branch -M main
git remote add origin https://github.com/<YOUR_ACCOUNT>/<YOUR_REPOSITORY>.git
git push -u origin main
```

GitHub Pages 배포 시에는 저장소 하위 경로(base path)에 맞춰 Vite의 `base` 설정과 라우팅 경로를 확인하세요. Vercel 또는 Netlify에서는 기본 Vite 프로젝트로 배포할 수 있습니다.

## 프로젝트 구조

```text
src/
  App.tsx       직무 탐색 데모 10화면과 사용자 상호작용
  db.ts         Dexie IndexedDB 데모 프로필 저장소
  store.ts      Zustand 화면/선택 상태
  index.css     모바일 UI 스타일
  main.tsx      앱 진입점과 PWA 등록
public/
  cookie.svg    데모용 쿠키 캐릭터 아이콘
```

## 구현 메모

- 현재 대화 응답과 분석 결과는 `src/App.tsx`의 데모 데이터입니다. 실제 AI 호출로 오인하지 않도록 화면에 데모 표시를 넣었습니다.
- 챗봇 프롬프트·챗봇 ID는 의도적으로 포함하지 않았습니다. 실제 연결 시 브라우저에서 API Key를 직접 호출하지 말고, 별도 서버 API를 통해 호출하세요.
- 프로젝트는 MIT License로 제공됩니다. 다른 라이선스가 필요하면 GitHub 공개 전에 `LICENSE`를 바꾸세요.

## 사용 기술

React · TypeScript · Vite · Zustand · Dexie · vite-plugin-pwa · CSS
