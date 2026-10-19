import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// 어느 폴더에서 vite를 실행해도 같은 파일을 찾도록 설정 파일 위치 기준의 절대 경로를 씁니다.
const here = (p) => fileURLToPath(new URL(p, import.meta.url)).split(sep).join('/');

/** @type {import('tailwindcss').Config} */
export default {
  content: [here('./index.html'), here('./src/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors: {
        primary: '#7B6CF6',
        lavender: '#EEEBFF',
        canvas: '#F7F6FB',
        ink: '#222222',
        muted: '#6B6B80',
        success: '#2FB270',
        warn: '#F0A030',
      },
      borderRadius: { card: '20px', bubble: '18px' },
      fontFamily: { sans: ['Pretendard Variable', 'Pretendard', 'system-ui', '-apple-system', 'sans-serif'] },
      boxShadow: { card: '0 2px 12px rgba(40, 30, 90, 0.06)' },
    },
  },
  plugins: [],
};
