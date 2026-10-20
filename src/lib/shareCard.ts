// 탐색 결과를 세로형 이미지 카드로 그려서 저장하거나 공유합니다. (시안 7번의 내려받기 아이콘)
import type { ExploreResult } from './schema';

const W = 1080;
const H = 1920;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareCard(result: ExploreResult, nickname?: string): Promise<Blob> {
  await (document.fonts?.ready ?? Promise.resolve());
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  const font = (size: number, weight = 500) => `${weight} ${size}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#EEEBFF');
  bg.addColorStop(1, '#F7F6FB');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#7B6CF6';
  ctx.font = font(40, 700);
  ctx.fillText('KHU:KEY', 96, 150);
  ctx.fillStyle = '#222';
  ctx.font = font(64, 700);
  ctx.fillText(nickname ? `쿠키가 발견한 ${nickname}의 키워드` : '쿠키가 발견한 나의 키워드', 96, 260);

  // 키워드 칩
  ctx.font = font(38, 600);
  let x = 96;
  let y = 340;
  for (const k of result.keywords) {
    const w = ctx.measureText(k).width + 64;
    if (x + w > W - 96) {
      x = 96;
      y += 96;
    }
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x, y, w, 76, 38);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillText(k, x + 32, y + 52);
    x += w + 20;
  }

  // 성향
  y += 170;
  ctx.fillStyle = '#222';
  ctx.font = font(48, 700);
  ctx.fillText('이런 성향을 가진 것 같아!', 96, y);
  y += 40;
  ctx.font = font(36, 500);
  for (const t of result.traits) {
    for (const line of wrap(ctx, t, W - 96 * 2 - 60)) {
      y += 60;
      ctx.fillStyle = '#7B6CF6';
      ctx.fillText('✓', 96, y);
      ctx.fillStyle = '#222';
      ctx.fillText(line, 150, y);
    }
    y += 12;
  }

  // 추천 직무
  y += 90;
  ctx.font = font(48, 700);
  ctx.fillStyle = '#222';
  ctx.fillText('쿠키의 추천 직무', 96, y);
  y += 30;
  for (const job of result.jobs) {
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 96, y, W - 192, 150, 28);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.font = font(40, 700);
    ctx.fillText(job.name, 136, y + 62);
    ctx.fillStyle = '#5E5E78';
    ctx.font = font(30, 500);
    ctx.fillText(wrap(ctx, job.summary, W - 192 - 80)[0] ?? '', 136, y + 112);
    y += 178;
  }

  ctx.fillStyle = '#5E5E78';
  ctx.font = font(30, 500);
  ctx.fillText('먼저 질문하는 AI 커리어 메이트, 쿠키', 96, H - 110);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}

// 공유 시트를 지원하면 공유, 아니면 내려받기. 돌려주는 값은 어느 쪽을 했는지입니다.
export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: '쿠키 탐색 결과' });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
