import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// 数据目录与 DATABASE_URL 必须在任何 @prisma/client 实例化之前确定
export const DATA_DIR = process.env.DIARY_DATA_DIR ?? path.resolve(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(DATA_DIR, 'diary.db')}`;
}

export const PORT = Number(process.env.DIARY_PORT ?? process.env.PORT ?? 3000);

export const JWT_SECRET = process.env.DIARY_JWT_SECRET ?? crypto.randomBytes(32).toString('hex');
if (!process.env.DIARY_JWT_SECRET) {
  console.warn('[diary] DIARY_JWT_SECRET 未设置，使用随机密钥（重启后所有会话失效）');
}
export const JWT_EXPIRES_IN = '7d';
export const TOKEN_COOKIE = 'diary_token';

// 前端静态产物目录（生产单容器模式；dev 时由 vite 提供）
export const WEB_DIR = process.env.DIARY_WEB_DIR ?? path.resolve(process.cwd(), '../web/dist');

// 仅首次初始化用户时使用
export const INITIAL_PASSWORD = process.env.DIARY_INITIAL_PASSWORD || undefined;
export const DEFAULT_TZ = process.env.DIARY_TZ ?? 'Asia/Shanghai';
