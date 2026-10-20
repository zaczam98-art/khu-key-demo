import { useState, type FormEvent } from 'react';
import { TitleHeader } from '../../components/Header';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, Field, Sheet } from '../../components/ui';
import { dateInputToIso, ddayLabel, formatDate, sortTasks } from '../../lib/dday';
import { db, TASK_TYPES, type Task, type TaskType } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { nowIso, uid } from '../../lib/ids';
import { useAppStore } from '../../store';

// 일정 전체 보기와 추가. 마감 D-day 와 우선순위는 코드가 계산합니다.
export function Schedule() {
  const showToast = useAppStore((s) => s.showToast);
  const { data: tasks, loading, reload } = useAsync(() => db.tasks.toArray(), []);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('기타');
  const [date, setDate] = useState('');
  const [est, setEst] = useState(30);

  const sorted = sortTasks(tasks ?? []);
  const pending = sorted.filter((t) => !t.done);
  const done = sorted.filter((t) => t.done);

  const toggle = async (t: Task) => {
    await db.tasks.put({ ...t, done: !t.done });
    reload();
  };
  const remove = async (t: Task) => {
    await db.tasks.delete(t.id);
    reload();
  };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    await db.tasks.add({ id: uid(), type, title: title.trim(), dueAt: dateInputToIso(date), estMin: est, done: false, priority: 0, lastNudgedAt: nowIso() });
    setTitle('');
    setDate('');
    setOpen(false);
    showToast('일정을 추가했어요');
    reload();
  };

  const Row = ({ t }: { t: Task }) => (
    <li className="card rise flex items-center gap-3 !p-3">
      <button type="button" aria-label={t.done ? '다시 할 일로' : '완료'} onClick={() => void toggle(t)} className="press flex h-11 w-11 items-center justify-center">
        <Icon name={t.done ? 'check-circle' : 'circle'} size={24} className={t.done ? 'text-success' : 'text-line'} />
      </button>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[0.875rem] ${t.done ? 'text-muted line-through' : 'text-ink'}`}>{t.title}</span>
        <span className="text-caption text-muted">
          {t.type} · {formatDate(t.dueAt)} · {t.estMin}분
        </span>
      </span>
      {!t.done && <Badge tone={ddayLabel(t.dueAt).startsWith('D+') ? 'danger' : 'warn'}>{ddayLabel(t.dueAt)}</Badge>}
      <button type="button" aria-label="지우기" onClick={() => void remove(t)} className="press flex h-9 w-9 items-center justify-center rounded-full text-muted/60">
        <Icon name="x" size={16} />
      </button>
    </li>
  );

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TitleHeader
        title="일정"
        back="/"
        right={
          <button type="button" aria-label="일정 추가" onClick={() => setOpen(true)} className="press flex h-11 w-11 items-center justify-center rounded-full text-primary">
            <Icon name="calendar-plus" size={22} />
          </button>
        }
      />
      <div className="flex-1 px-4 pb-8 pt-2">
        {loading && <div className="skeleton h-24 rounded-card" />}
        {!loading && pending.length === 0 && done.length === 0 && (
          <EmptyState expr="wink" title="일정이 비어 있어" desc={'지원 건을 추가하면 마감이 자동으로 들어오고,\n오른쪽 위에서 직접 추가할 수도 있어.'} />
        )}
        {pending.length > 0 && (
          <ul className="space-y-2">
            {pending.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        )}
        {done.length > 0 && (
          <>
            <h3 className="mb-2 mt-6 text-small font-semibold text-muted">끝낸 일 {done.length}</h3>
            <ul className="space-y-2">
              {done.map((t) => (
                <Row key={t.id} t={t} />
              ))}
            </ul>
          </>
        )}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="일정 추가">
        <form onSubmit={add} className="space-y-4">
          <Field label="할 일">
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 인적성 모의 풀기" required />
          </Field>
          <Field label="종류">
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.map((t) => (
                <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`chip press ${type === t ? 'chip-on' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="날짜">
              <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="예상 시간(분)">
              <input className="field" type="number" min={5} step={5} value={est} onChange={(e) => setEst(Number(e.target.value))} />
            </Field>
          </div>
          <button type="submit" className="btn-primary w-full">
            <Icon name="check" size={18} />
            추가
          </button>
        </form>
      </Sheet>
    </div>
  );
}
