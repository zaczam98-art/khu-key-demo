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

## 실측 (2026-10-25, 팀 키와 스튜디오 챗봇 3개로 첫 호출)

- 스튜디오 챗봇 직무 탐색 56334, 자소서 56335, 면접 56336에 `POST /chatbots/{id}/chat/completions`를 보내 모두 200을 받았습니다. 주소 끝 슬래시는 있어도 없어도 됩니다.
- 응답의 `model`은 `gpt-6-luna`(스튜디오에서 지정한 모델)이고, `usage`는 `null`이며 대신 `credits` 숫자가 옵니다. `lib/chatkhu.ts`는 `credits`가 있으면 그 값을 그대로 기록하므로 추정식은 쓰이지 않습니다.
- 짧은 인사 1턴의 비용은 챗봇마다 0.29~0.62 크레딧이고, 개발 서버 `/api/chat/*`를 거친 1턴은 0.31~0.34 크레딧이었습니다.
- `/api/extract`(일반 `chat/completions`, `claude-sonnet-5-5`, JSON 스키마)는 6턴 대화 1건에 9.16 크레딧이 들었고, 응답은 zod 검증을 통과했습니다. 일일 상한 550이면 추출 약 60회 분량입니다.
- 처음 보낸 요청이 400 "There was an error parsing the body"였는데, API 문제가 아니라 Windows Git Bash에서 curl `-d`에 한글을 직접 넣어 깨진 것이었습니다. UTF-8 파일 본문(`--data-binary @file`)으로 보내면 정상입니다. 서버 코드는 `fetch`로 JSON을 보내므로 해당 없습니다.
- 스튜디오 챗봇 3개의 첫 응답은 모두 존댓말이고 자기를 "루미"라고 소개하며, 자소서 챗봇은 `**굵게**` 마크다운을 섞어 보냈습니다. 이벤트 태그는 1턴에서는 당연히 나오지 않아 아직 확인하지 못했습니다. 스튜디오 지시문에서 고칠 것: 이름(이 시점에는 쿠키로 적었으나 같은 날 오후 루다로 결정), 반말 친근체, 마크다운 금지, 이벤트 태그 규약(docs/prompts.md). 경험 인터뷰 챗봇은 아직 없어서 `CHATKHU_BOT_INTERVIEW`는 비어 있고 일반 모델로 대신 돌아갑니다.
- 같은 날 오후, 직무 탐색 챗봇(56334)과 앱 화면에서 6턴을 실제로 대화했습니다. 챗봇은 한 번에 질문 하나씩 되묻기는 하지만, 사용자 메시지 4개 뒤 "- " 선택지, 번호 질문 3개, `<<EVENT:{"type":"analyze"}>>` 태그가 모두 나오지 않았고 6턴째에 `**굵게**` 마크다운이 나왔습니다. 스튜디오 지시문에 이벤트 규약이 아직 반영되지 않은 상태입니다. 앱은 사용자 메시지 9개 뒤 마무리 칩으로 넘어가므로 동작은 하지만, 규약이 들어가야 시안 흐름대로 5~6번 화면으로 이어집니다.
- 챗봇 id 56333은 계정에 있으나 "API 호출이 비활성화"(403, code 105)였고 56337·56338은 없습니다(404). 새로 만든 경험 인터뷰 챗봇이 56333이라면 스튜디오에서 "API로 이 챗봇 호출하기"를 켜야 합니다.
- 경험 인터뷰 챗봇은 56366입니다. 처음엔 "API 호출이 비활성화"(403, code 105)였고, 스튜디오에서 "API로 이 챗봇 호출하기"를 켠 뒤 200으로 응답했습니다(모델 `gpt-6-luna`, 1턴 0.88 크레딧). `CHATKHU_BOT_INTERVIEW=56366`으로 4개 챗봇 id가 모두 채워졌습니다.

## 음성 실측 (2026-10-25)

- TTS `POST /audio/speech/` 본문 `{model:"gemini-3.8-flash-tts", input}`. `voice`를 비우면 기본 화자를 쓰고, OpenAI식 이름("alloy")을 넣으면 400 "No matching speaker voice"입니다. `response_format`은 무시되고 항상 `audio/pcm`(헤더 없는 24kHz 16bit mono PCM)이 옵니다. 그래서 `api/tts.ts`가 WAV 헤더를 붙여 `audio/wav`로 내려 줍니다. 24kHz가 맞는지는 만들어진 WAV를 STT에 되돌려 보내 같은 문장이 나오는 것으로 확인했습니다. 36자 문장이 6.2초였습니다.
- STT `POST /audio/transcriptions/` multipart `file`(wav 16kHz mono) + `model`. 모델은 `stt-async-v5`만 됩니다(`whisper-1`은 404, 모델 생략은 422). 응답은 `{operation_id, status:"processing", model, duration_seconds, credits_charged}`이고, `GET /audio/transcriptions/{operation_id}/`가 `{status:"completed", text, segments[{speaker,text,start_ms,end_ms}], duration_seconds}`를 돌려줍니다. 6.8초 음성이 2초 안에 완료됐고 받아쓰기는 글자 하나 틀리지 않았습니다.
- STT 비용은 `credits_charged`로 옵니다. 6.77초에 0.677이므로 1초당 0.1, 60초 답변이면 약 6 크레딧입니다. `api/stt.ts`는 이 값을 그대로 기록합니다.
- 오디오 모델 목록(404 메시지에 포함): gemini-2.5-flash-preview-tts, gemini-2.5-pro-preview-tts, gemini-3.1-flash-tts-preview, gemini-3.8-flash-tts, lyria-3-pro-preview, lyria-3-clip-preview, elevenlabs-music, elevenlabs-sfx, stt-async-v5.
