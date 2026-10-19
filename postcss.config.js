import { fileURLToPath } from 'node:url';

// Tailwind가 현재 작업 폴더가 아니라 이 프로젝트의 설정 파일을 읽도록 경로를 명시합니다.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
