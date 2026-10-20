// 화면 테마. 기본은 밝게(시안 기준)이고, 프로필 > 설정에서 시스템/밝게/어둡게를 고릅니다.
export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'khu-theme';

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'system' || v === 'dark' ? v : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(pref: ThemePref = getThemePref()): void {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#16141F' : '#7B6CF6');
}

export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // 저장 못 해도 이번 화면에는 적용합니다.
  }
  applyTheme(pref);
}
