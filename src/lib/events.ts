// 모델 응답 끝의 <<EVENT:{"type":"..."}>> 태그를 떼어 내고 화면 전환 이벤트로 돌려줍니다. (CLAUDE.md 6절)
export type BotEvent = { type: string; [key: string]: unknown };

export function splitEvents(content: string): { text: string; events: BotEvent[] } {
  const events: BotEvent[] = [];
  const text = content
    .replace(/<<EVENT:(\{[\s\S]*?\})>>/g, (_match, json: string) => {
      try {
        const parsed = JSON.parse(json) as BotEvent;
        if (parsed && typeof parsed.type === 'string') events.push(parsed);
      } catch {
        // 깨진 태그는 무시하고 본문만 보여 줍니다.
      }
      return '';
    })
    .trim();
  return { text, events };
}
