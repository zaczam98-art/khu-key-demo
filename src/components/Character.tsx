export type Expr = 'default' | 'smile' | 'think' | 'wink' | 'suit' | 'heart';

// public/char/{expr}.png. 팀의 캐릭터 원본이 오면 같은 파일명으로 바꿔 끼웁니다. (CLAUDE.md 6절)
export function Character({ expr = 'default', size = 160, className = '' }: { expr?: Expr; size?: number; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}char/${expr}.png`}
      width={size}
      height={size}
      alt="쿠키"
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}
