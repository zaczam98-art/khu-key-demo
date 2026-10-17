import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/khu-key-demo/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['cookie.svg'],
      manifest: {
        name: 'KHU:KEY | 커리어 메이트',
        short_name: 'KHU:KEY',
        description: '쿠키와 함께 나의 경험에서 커리어 키워드를 찾아봐요.',
        theme_color: '#f7f5ff',
        background_color: '#f7f5ff',
        display: 'standalone',
        start_url: '/khu-key-demo/',
        icons: [{ src: 'cookie.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      }
    })
  ],
  server: { host: '0.0.0.0' }
});
