# ChatKHU API 확인 기록

확인일 2026-10-17. 출처는 공식 문서 https://docs.mindlogic.ai/docs/khu/ 아래의 API Gateway 개요(`api-gateway/getting-started/overview`), 챗봇 API 호출(`baze/product/api-access`), Chat Completions 레퍼런스(`api-gateway/reference/chat-completions`), 모델 목록(`api-gateway/getting-started/models`)입니다. 아직 키가 없어 실측은 하지 못했고, 실측 결과는 맨 아래 절에 덧붙입니다.

## (가) 스튜디오 챗봇 호출 형식

- `POST https://factchat-cloud.mindlogic.ai/v1/gateway/chatbots/{chatbot_id}/chat/completions/`
- 헤더: `Authorization: Bearer <키>`, `Content-Type: application/json`
- 본문: `{"messages":[{"role":"user","content":"..."}], "stream": false}`
  - 무상태입니다. 이전 턴을 매 호출마다 모두 보내야 합니다.
  - `model` 파라미터는 없고 챗봇에 설정된 모델을 씁니다. `system` 메시지는 챗봇이 지시문을 갖고 있으므로 무시됩니다.
- 응답: OpenAI `chat.completion` 형식입니다. `choices[0].message.content`, `finish_reason`, 그리고 `credits`(이번 호출에 차감된 크레딧, 예 12.5)와 `files[]`가 옵니다.
- 제한: 챗봇 라우트는 분당 30회(초과 시 429). 수퍼 에이전트 챗봇은 400으로 거절됩니다.
- 오류: 401 키 없음·잘못됨·Base URL 불일치, 403 조직의 게이트웨이 비활성 또는 챗봇의 API 호출 스위치 꺼짐, 404 챗봇 없음, 400 지원하지 않는 챗봇 또는 안전 필터 거부.
- 준비 절차: 챗봇 id는 스튜디오 대시보드 URL `/dashboard/studio/[chatbot_id]`에서 봅니다. 챗봇 상세 > 공유 > API 탭 > "API로 이 챗봇 호출하기"를 켭니다(기본 꺼짐). API 키는 좌측 사이드바 하단 API Gateway 화면 > API 키 탭 > API 키 생성에서 발급합니다.

## (나) 응답에 토큰 사용량(usage)이 포함되는지

- 챗봇 엔드포인트: `usage`는 항상 `null`이고 대신 `credits` 숫자가 옵니다. 따라서 크레딧 기록은 `credits` 값을 그대로 씁니다.
- 일반 `chat/completions`: 비스트리밍 응답 예시가 문서에 없습니다. 스트리밍에서는 `stream_options.include_usage`를 켜면 마지막 청크에 `usage`가 옵니다. 비스트리밍 응답의 `usage`와 `credits` 유무는 실측으로 확인해야 하며, 없으면 코드가 글자 수÷2로 근사합니다.

## (다) 인증 헤더

- `Authorization: Bearer YOUR_API_KEY`(OpenAI 방식)와 `x-api-key: YOUR_API_KEY`(Anthropic SDK 방식) 둘 다 됩니다. 이 프로젝트는 `Authorization: Bearer`를 씁니다.
- 키는 발급된 Base URL에서만 유효하고 다른 주소에서는 401입니다. 구글 AI 스튜디오 키처럼 다른 서비스의 키는 쓸 수 없습니다.

## 일반 chat/completions (구조화 출력용)

- `POST https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions/`
- 본문: `model`, `messages`(system/developer/user/assistant), `temperature`, `max_tokens`, `stream`, `response_format`, `tools` 등 OpenAI 호환입니다.
- 구조화 출력: `response_format: {"type":"json_schema","json_schema":{"name":"...","strict":true,"schema":{...}}}`. 스키마에 `additionalProperties: false`가 있어야 합니다. 단순 JSON 모드는 문서에 없습니다.
- 모델 id(2026-10-14 목록 일부): `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5`, `gpt-5.5`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `solar-pro4`. 조직 설정에 따라 다르므로 `GET /v1/gateway/models/`로 확인합니다.
- 단가: 문서에 없습니다. CLAUDE.md의 추정 단가(1K 토큰당 Sonnet 2/10, Haiku 1/5, Gemini 3.8 Flash 0.75/3.75)는 미검증이며 `POST /v1/gateway/estimate/`와 `GET /v1/gateway/usage/`로 실측할 예정입니다.

## 그 밖의 엔드포인트

- TTS `POST /audio/speech/`(input 4,000자 제한), STT `POST /audio/transcriptions/`와 `GET .../{operation_id}/`
- PII 탐지·마스킹 `POST /guard/`
- 잔액 `GET /credits/`, 사용량 `GET /usage/`, 사전 견적 `POST /estimate/`
- 일반 레이트리밋 60초에 120회, 요청 본문 25MB

## 실측 기록

키를 받은 뒤 아래를 채웁니다.

| 날짜 | 엔드포인트 | 요청 요약 | 응답의 usage/credits | 비고 |
|---|---|---|---|---|
| | | | | |
