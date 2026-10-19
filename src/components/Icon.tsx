import type { JobIcon } from '../data/jobs';

export type IconName = JobIcon | 'home' | 'compass' | 'user' | 'doc' | 'mic' | 'check' | 'download' | 'heart' | 'bulb';

const PATHS: Record<IconName, string> = {
  chart: 'M4 20V10h3v10H4zm6.5 0V4h3v16h-3zM17 20v-7h3v7h-3z',
  play: 'M8 5v14l11-7L8 5z',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  data: 'M12 3C7 3 3 4.5 3 6.5v11c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-11C21 4.5 17 3 12 3zm0 2c4.4 0 7 1.2 7 1.5S16.4 8 12 8 5 6.8 5 6.5 7.6 5 12 5z',
  design: 'M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  brand: 'M12 2l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7L12 2z',
  people: 'M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  server: 'M4 4h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 10h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm2-7a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  handshake: 'M11 6l-4.5 4.5a1.5 1.5 0 0 0 2.1 2.1L11 10.2l1 1-2.5 2.5a1.5 1.5 0 0 0 2.1 2.1l3.9-3.9 2 2a1.4 1.4 0 0 0 2-2L15 7.4A3 3 0 0 0 12.9 6.5L11 6zM2 8l5-2 1 1-4 4-2-3zm20 0l-5-2-1 1 4 4 2-3z',
  home: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4 6l-2.5 6L8 16.5 10.5 10 16 8z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 4v2h16v-2c0-2.3-4.7-4-8-4z',
  doc: 'M6 2h8l6 6v14H6V2zm7 1.5V9h5.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z',
  mic: 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3h2a7 7 0 0 1-6 6.9V21h-2v-3.1A7 7 0 0 1 5 11h2a5 5 0 0 0 10 0z',
  check: 'M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4L9 16.2z',
  download: 'M12 3v10.2l3.6-3.6L17 11l-5 5-5-5 1.4-1.4L11 13.2V3h1zM4 19h16v2H4v-2z',
  heart: 'M12 21s-7.5-4.6-9.5-9A5.5 5.5 0 0 1 12 6.1 5.5 5.5 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9z',
  bulb: 'M9 21h6v-1H9v1zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
};

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}
