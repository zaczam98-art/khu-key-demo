import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DemoState = {
  screen: number;
  styleChoices: string[];
  userMessage: string;
  setScreen: (screen: number) => void;
  toggleStyle: (style: string) => void;
  setUserMessage: (message: string) => void;
  reset: () => void;
};

const initial = {
  screen: 1,
  styleChoices: [] as string[],
  userMessage: '',
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...initial,
      setScreen: (screen) => set({ screen: Math.min(10, Math.max(1, screen)) }),
      toggleStyle: (style) => set((state) => ({
        styleChoices: state.styleChoices.includes(style)
          ? state.styleChoices.filter((item) => item !== style)
          : [...state.styleChoices, style],
      })),
      setUserMessage: (userMessage) => set({ userMessage }),
      reset: () => set(initial),
    }),
    { name: 'khu-key-demo-state' },
  ),
);
