import { Character } from './Character';

// 2단계 이후에 만들 모듈의 자리표시 화면
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
      <h1 className="text-[20px] font-bold text-ink">{title}</h1>
      <div className="card mt-4 flex items-center gap-3">
        <Character expr="wink" size={56} className="shrink-0 rounded-full bg-lavender" />
        <p className="text-[14px] leading-relaxed text-muted">{note}</p>
      </div>
    </div>
  );
}
