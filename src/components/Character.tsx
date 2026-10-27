export type Expr = 'default' | 'smile' | 'think' | 'wink' | 'suit' | 'heart';

// public/char/{expr}.png. 팀 시트(design/05_캐릭터_표정.png)에서 잘랐습니다. (CLAUDE.md 6절)
// default: 평상시(인사·질문·안내)  smile: "잘했어!" 엄지(답변 뒤, 카드·분석·초안 완료, 결과)  think: 고민  wink: 응원  suit: 면접관  heart: 칭찬·저장 완료
// smile 은 칭찬하는 순간에만 씁니다. 인사나 질문에는 default 입니다. (2026-10-27)
export function Character({
  expr = 'default',
  size = 160,
  className = '',
  float = false,
}: {
  expr?: Expr;
  size?: number;
  className?: string;
  float?: boolean;
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}char/${expr}.png`}
      width={size}
      height={size}
      alt="루다"
      draggable={false}
      className={`select-none ${float ? 'float' : ''} ${className}`}
    />
  );
}
