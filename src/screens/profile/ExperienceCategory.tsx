import { useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { TitleHeader } from '../../components/Header';
import { Icon, type IconName } from '../../components/Icon';
import { db } from '../../lib/db';
import { CATEGORIES } from '../../lib/schema';

// 경험 카드 1. 분류 고르기. 고르면 그 분류를 문맥으로 경험 인터뷰가 시작됩니다.
const ICONS: Record<(typeof CATEGORIES)[number], IconName> = {
  동아리: 'people', 학회: 'book', 학생회: 'flag', 봉사: 'heart', 아르바이트: 'coin', 인턴십: 'briefcase', 공모전: 'award', '자격증·교육': 'check-circle', 기타: 'sparkle',
};

export function ExperienceCategory() {
  const nav = useNavigate();
  const start = async (category: string) => {
    await db.chatLogs.delete('log:interview');
    nav(`/profile/experience/chat?category=${encodeURIComponent(category)}`, { viewTransition: true });
  };
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader title="경험 카드 만들기" back="/profile" />
      <div className="flex-1 px-4 pb-8 pt-2">
        <div className="rise flex items-start gap-3">
          <Character expr="smile" size={56} className="shrink-0 rounded-full bg-lavender" />
          <div className="bubble-bot">{'어떤 경험을 정리해 볼까?\n분류 하나만 골라 주면 내가 질문할게.'}</div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {CATEGORIES.map((c, i) => (
            <button key={c} type="button" onClick={() => void start(c)} className="card rise press flex min-h-[96px] flex-col items-center justify-center gap-2 !p-3" style={{ animationDelay: `${100 + i * 50}ms` }}>
              <span className="tile h-10 w-10 bg-lavender text-primary">
                <Icon name={ICONS[c]} size={20} />
              </span>
              <span className="text-small font-medium text-ink">{c}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-caption text-muted">실명, 학번, 연락처는 묻지 않아요. 카드는 이 기기에만 저장돼요.</p>
      </div>
    </div>
  );
}
