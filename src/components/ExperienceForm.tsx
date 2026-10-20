import { Field } from './ui';
import { CATEGORIES, type ExperienceCard } from '../lib/schema';

// 경험 카드 편집 폼. 목록 필드는 한 줄에 하나씩 적습니다.
const lines = (arr: string[]) => arr.join('\n');
const parse = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean);

export function ExperienceForm({ value, onChange }: { value: ExperienceCard; onChange: (next: ExperienceCard) => void }) {
  const set = <K extends keyof ExperienceCard>(key: K, v: ExperienceCard[K]) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field label="제목">
        <input className="field" value={value.title} onChange={(e) => set('title', e.target.value)} maxLength={40} />
      </Field>
      <Field label="분류">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={value.category === c} onClick={() => set('category', c)} className={`chip press ${value.category === c ? 'chip-on' : ''}`}>
              {c}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="시작">
          <input type="month" className="field" value={value.period.from} onChange={(e) => set('period', { ...value.period, from: e.target.value })} />
        </Field>
        <Field label="끝 (진행 중이면 비움)">
          <input type="month" className="field" value={value.period.to} onChange={(e) => set('period', { ...value.period, to: e.target.value })} />
        </Field>
      </div>
      <Field label="역할">
        <input className="field" value={value.role} onChange={(e) => set('role', e.target.value)} maxLength={60} />
      </Field>
      <Field label="한 일" hint="한 줄에 하나씩">
        <textarea className="field min-h-[96px]" value={lines(value.activities)} onChange={(e) => set('activities', parse(e.target.value))} />
      </Field>
      <Field label="성과" hint="숫자가 있으면 그대로 적기">
        <textarea className="field min-h-[72px]" value={lines(value.achievements)} onChange={(e) => set('achievements', parse(e.target.value))} />
      </Field>
      <Field label="배운 점">
        <textarea className="field min-h-[72px]" value={lines(value.learned)} onChange={(e) => set('learned', parse(e.target.value))} />
      </Field>
      <Field label="역량 키워드" hint="쉼표로 구분">
        <input className="field" value={value.skills.join(', ')} onChange={(e) => set('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
      </Field>
    </div>
  );
}
