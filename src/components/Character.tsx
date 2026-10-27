export type Expr =
  | 'default' | 'smile' | 'think' | 'wink' | 'suit' | 'heart'
  | 'explain' | 'laptop' | 'idea' | 'surprised' | 'write' | 'search' | 'done' | 'listen' | 'guide';

// public/char/{expr}.png. 팀 시트(design/05_캐릭터_표정.png)에서 잘랐습니다. (CLAUDE.md 6절)
// default 평상시(인사·질문)  smile "잘했어!" 엄지(답변 뒤, 카드·분석·첨삭 완료)  think 고민(대기·빈 상태)  wink 응원  suit 면접관  heart 칭찬·저장 완료
// explain 설명(결과 요약, 보완 안내)  laptop 작업 중(분석·채점)  idea 제안(추천 직무, 경험 추천)  surprised 놀람(못 찾음)
// write 작성 도움(자소서 입력·빈 상태)  search 검색(공고 읽기, 직무 없음)  done 완료!(프로필·자소서·면접 끝)  listen 고민 듣기(사용자가 입력 중)  guide 안내(활용 안내)
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
