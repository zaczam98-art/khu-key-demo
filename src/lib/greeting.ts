// 홈 화면 첫 줄. 시각에 따라 바뀝니다. 날짜·시각 판단은 LLM이 아니라 코드가 합니다. (CLAUDE.md 9절)
export function greetingByHour(hour: number): string {
  if (hour < 5) return '늦은 밤까지 고생이 많아.';
  if (hour < 12) return '좋은 아침이야!';
  if (hour < 18) return '오후도 힘내 보자!';
  return '오늘 하루도 수고했어.';
}
