import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// 어느 폴더에서 vite를 실행해도 같은 파일을 찾도록 설정 파일 위치 기준의 절대 경로를 씁니다.
const here = (p) => fileURLToPath(new URL(p, import.meta.url)).split(sep).join('/');
// 색은 src/index.css 의 CSS 변수(--c-*)를 읽습니다. 다크 모드는 변수만 바뀝니다.
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [here('./index.html'), here('./src/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors: {
        primary: c('--c-primary'),
        lavender: c('--c-primary-soft'),
        canvas: c('--c-bg'),
        surface: c('--c-surface'),
        surface2: c('--c-surface-2'),
        ink: c('--c-ink'),
        muted: c('--c-muted'),
        line: c('--c-line'),
        success: c('--c-success'),
        warn: c('--c-warn'),
        danger: c('--c-danger'),
        info: c('--c-info'),
        frame: c('--c-frame'),
      },
      // 글자 크기 6단계 (CLAUDE.md 7절 토큰을 단계로 정리)
      fontSize: {
        caption: ['0.6875rem', { lineHeight: '1.4' }],
        small: ['0.8125rem', { lineHeight: '1.5' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        heading: ['1.0625rem', { lineHeight: '1.4', fontWeight: '600' }],
        title: ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        display: ['1.625rem', { lineHeight: '1.25', fontWeight: '700' }],
      },
      borderRadius: { card: '20px', bubble: '18px', tile: '14px' },
      fontFamily: { sans: ['Pretendard Variable', 'Pretendard', 'system-ui', '-apple-system', 'sans-serif'] },
      boxShadow: { card: '0 2px 12px rgba(40, 30, 90, 0.06)', pop: '0 8px 24px rgba(40, 30, 90, 0.14)' },
      transitionDuration: { fast: 'var(--dur-fast)', base: 'var(--dur-base)', slow: 'var(--dur-slow)' },
      transitionTimingFunction: { app: 'var(--ease)' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [],
};
