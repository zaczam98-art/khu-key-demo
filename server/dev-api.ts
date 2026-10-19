// pnpm dev 에서 api/*.ts 핸들러를 /api/* 로 띄우는 Vite 플러그인. Vercel 배포에서는 쓰이지 않습니다.
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';

type Handler = (request: Request) => Promise<Response>;

export function devApi(): Plugin {
  return {
    name: 'khu-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        const url = new URL(req.url, 'http://localhost');
        const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
        const apiRoot = resolve(server.config.root, 'api');
        let file = join(apiRoot, ...segments) + '.ts';
        if (!existsSync(file) && segments.length) {
          const dir = join(apiRoot, ...segments.slice(0, -1));
          const dynamic = existsSync(dir) ? readdirSync(dir).find((f) => /^\[.+\]\.ts$/.test(f)) : undefined;
          if (dynamic) file = join(dir, dynamic);
        }
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        try {
          const mod = (await server.ssrLoadModule(file)) as Record<string, Handler | undefined>;
          const handler = mod[req.method ?? 'GET'] ?? mod.default;
          if (!handler) {
            res.statusCode = 405;
            res.end();
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e));
        }
      });
    },
  };
}
