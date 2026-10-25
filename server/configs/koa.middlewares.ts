import fs from 'node:fs';
import path from 'node:path';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import { HttpError } from 'routing-controllers';
import { TOKEN_COOKIE, WEB_DIR } from './constants';
import { verifyToken } from '../app/shared/jwt';

const PUBLIC_API_PATHS = new Set(['/api/health', '/api/auth/login']);

export function setupKoaMiddlewares(app: Koa): void {
  // 统一错误处理（含 routing-controllers HttpError）
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: unknown) {
      const e = err as { httpCode?: number; status?: number; statusCode?: number; message?: string };
      const raw = e?.httpCode ?? e?.status ?? e?.statusCode ?? 500;
      const status = typeof raw === 'number' && raw >= 400 && raw < 600 ? raw : 500;
      ctx.status = status;
      ctx.body = { message: status >= 500 ? 'internal server error' : (e?.message ?? 'error') };
      if (status >= 500) console.error('[dulora] unhandled error:', err);
    }
  });

  // trace-id + 访问日志
  app.use(async (ctx, next) => {
    const traceId = ctx.get('x-request-id') || Math.random().toString(36).slice(2, 10);
    ctx.set('x-trace-id', traceId);
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    if (ctx.path.startsWith('/api')) {
      console.log(`[${traceId}] ${ctx.method} ${ctx.originalUrl} ${ctx.status} ${ms}ms`);
    }
  });

  app.use(
    cors({
      origin: (ctx) => ctx.get('origin') || '*',
      credentials: true,
    })
  );

  app.use(bodyParser({ jsonLimit: '10mb', textLimit: '10mb' }));

  // auth 守卫：/api/** 除白名单外都要求有效 JWT Cookie
  app.use(async (ctx, next) => {
    if (!ctx.path.startsWith('/api') || PUBLIC_API_PATHS.has(ctx.path)) {
      return next();
    }
    const token = ctx.cookies.get(TOKEN_COOKIE);
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      ctx.status = 401;
      ctx.body = { message: 'unauthorized' };
      return;
    }
    ctx.state.userId = payload.sub;
    return next();
  });

  // 静态产物 + SPA fallback（仅当 web 构建产物存在时启用；dev 走 vite）
  const indexHtml = path.join(WEB_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(serve(WEB_DIR));
    app.use(async (ctx, next) => {
      await next();
      if (ctx.method === 'GET' && !ctx.path.startsWith('/api') && (ctx.status === 404 || ctx.body == null)) {
        ctx.status = 200;
        ctx.type = 'html';
        ctx.body = fs.createReadStream(indexHtml);
      }
    });
  }
}
