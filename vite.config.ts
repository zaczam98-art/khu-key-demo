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
  return {
    base,
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
