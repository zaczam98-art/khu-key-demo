import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExploreResult } from './lib/schema';

type Mode = 'live' | 'demo' | null;
type AppState = {
  result: ExploreResult | null;
  selectedJob: number;
  mode: Mode;
  credits: number;
  toast: string | null;
  setResult: (result: ExploreResult | null) => void;
  selectJob: (index: number) => void;
  note: (demo: boolean, credits?: number) => void;
  resetExplore: () => void;
  showToast: (message: string) => void;
};

let toastTimer: number | undefined;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      result: null,
      selectedJob: 0,
      mode: null,
      credits: 0,
      toast: null,
      setResult: (result) => set({ result }),
      selectJob: (selectedJob) => set({ selectedJob }),
      note: (demo, credits) => set((s) => ({ mode: demo ? 'demo' : 'live', credits: s.credits + (credits ?? 0) })),
      resetExplore: () => set({ result: null, selectedJob: 0 }),
      showToast: (toast) => {
        set({ toast });
        if (typeof window === 'undefined') return;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => set({ toast: null }), 2200);
      },
    }),
    {
      name: 'khu-key-state',
      partialize: (s) => ({ result: s.result, selectedJob: s.selectedJob, mode: s.mode, credits: s.credits }),
    },
  ),
);
