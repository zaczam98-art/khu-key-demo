import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { applyTheme } from './lib/theme';

applyTheme();
// View Transitions API 를 지원하는 브라우저에서는 화면 전환을 브라우저에 맡깁니다. (src/index.css)
if ('startViewTransition' in document) document.documentElement.classList.add('has-vt');
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
