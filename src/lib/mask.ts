// 서버로 보내기 전에 전화번호·이메일·학번 형식을 지웁니다. (CLAUDE.md 5절, 9절)
export function mask(text: string): string {
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[이메일]')
    .replace(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g, '[전화번호]')
    .replace(/(?<!\d)20\d{8}(?!\d)/g, '[학번]');
}
