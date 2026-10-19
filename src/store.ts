import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExploreResult } from './lib/schema';

type Mode = 'live' | 'demo' | null;
type AppState = {
  result: ExploreResult | null;
  selectedJob: number;
  mode: Mode;
  credits: number;
  setResult: (result: ExploreResult | null) => void;
  selectJob: (index: number) => void;
  note: (demo: boolean, credits?: number) => void;
  resetExplore: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      result: null,
      selectedJob: 0,
      mode: null,
      credits: 0,
      setResult: (result) => set({ result }),
      selectJob: (selectedJob) => set({ selectedJob }),
      note: (demo, credits) => set((s) => ({ mode: demo ? 'demo' : 'live', credits: s.credits + (credits ?? 0) })),
      resetExplore: () => set({ result: null, selectedJob: 0 }),
    }),
    { name: 'khu-key-state' },
  ),
);
