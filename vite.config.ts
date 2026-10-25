import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { devApi } from './server/dev-api';

export default defineConfig(({ mode }) => {
  // .env.local 의 CHATKHU_* 값을 개발 서버의 api 핸들러(process.env)에서도 읽을 수 있게 합니다.
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;
  const base = process.env.VITE_BASE || '/';
  // index.html 의 공유용 메타 태그(og:url, og:image)가 쓰는 절대 주소. Vercel 빌드에서는 프로덕션 도메인을 자동으로 쓰고,
  // 그 밖에는 Pages 주소입니다. 다른 곳에 올리면 VITE_SITE_URL 로 바꿉니다.
  if (!process.env.VITE_SITE_URL)
    process.env.VITE_SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/`
      : 'https://zaczam98-art.github.io/khu-key-demo/';
  return {
    base,
    build: {
      rollupOptions: {
        // node_modules 는 vendor 한 덩어리로 두어 배포마다 바뀌지 않게 하고, 모듈 4개는 App.tsx 의 늦은 불러오기로 나뉩니다.
        output: { manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined) },
      },
    },
    plugins: [
      react(),
      devApi(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['char/*.png', 'icons/*.png', 'push-sw.js'],
        workbox: {
          importScripts: ['push-sw.js'],
          navigateFallbackDenylist: [/^\/api\//],
        },
        manifest: {
          name: '쿠키 | KHU:KEY 커리어 메이트',
          short_name: '쿠키',
          description: '먼저 질문하는 AI 커리어 메이트, 쿠키',
          lang: 'ko',
          theme_color: '#7B6CF6',
          background_color: '#F7F6FB',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
    ],
    server: { host: '0.0.0.0' },
    test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
  };
});
