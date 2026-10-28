// POST /api/job-post  { url } -> { text, demo }
// 사용자가 넣은 링크 1건만 가져옵니다. 로그인 우회·대량 수집은 하지 않습니다. (CLAUDE.md 9절) 실패하면 붙여넣기를 안내합니다.
import { demoData } from '../server/lib/chatkhu.js';
import { json } from '../server/lib/http.js';

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const raw = (body?.url ?? '').trim();
  let target: URL;
  try {
    target = new URL(raw);
    if (!/^https?:$/.test(target.protocol)) throw new Error('protocol');
  } catch {
    return json({ error: '링크 형식이 아니에요. http(s)로 시작하는 주소를 넣어 주세요.' }, 400);
  }
  if (target.hostname === 'example.com' || target.hostname.endsWith('.example')) return json({ text: demoData.post.text, demo: true });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(target, { signal: controller.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; KHU-KEY/0.3; +https://github.com/zaczam98-art/khu-key-demo)' }, redirect: 'follow' });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = htmlToText(await r.text()).slice(0, 12_000);
    if (text.length < 200) throw new Error('too short');
    return json({ text, demo: false });
  } catch (e) {
    const detail = (e as Error).message;
    // 왜 안 되는지 화면에서 바로 알 수 있게 이유를 나눕니다. 스크립트로 그리는 사이트(기아 채용, 원티드 등)와 외부 접근을 막는 사이트가 대부분입니다.
    const why = detail === 'too short'
      ? '이 사이트는 공고를 화면에서 스크립트로 그려서 링크만으로는 본문을 읽을 수 없어요.'
      : /HTTP (401|403|429|999)/.test(detail)
        ? '이 사이트가 외부 접근을 막고 있어요.'
        : /HTTP 404/.test(detail)
          ? '공고 주소를 찾을 수 없어요. 로그인해야 보이는 공고일 수 있어요.'
          : /abort/i.test(detail)
            ? '사이트 응답이 너무 늦어요.'
            : '공고를 가져오지 못했어요.';
    return json({ error: `${why} 공고 본문을 복사해 붙여 넣어 주세요.`, detail }, 502);
  }
}
