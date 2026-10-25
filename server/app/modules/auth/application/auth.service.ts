import crypto from 'node:crypto';
import { Service } from 'typedi';
import { HttpError } from 'routing-controllers';
import { prisma } from '../../../shared/prisma';
import { hashPassword, verifyPassword } from '../../../shared/password';
import { signToken } from '../../../shared/jwt';
import { INITIAL_PASSWORD, DEFAULT_TZ } from '../../../../configs/constants';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

/** 首次启动初始化单用户（id=1）与默认设置 */
export async function ensureUser(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id: 1 } });
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, timezone: DEFAULT_TZ },
    update: {},
  });
  if (existing) return;

  let password = INITIAL_PASSWORD;
  const generated = !password;
  if (!password) password = crypto.randomBytes(9).toString('base64url');
  await prisma.user.create({ data: { id: 1, passwordHash: await hashPassword(password) } });
  if (generated) {
    console.warn(`[diary] 已生成初始密码（仅此一次显示，请在设置页修改）: ${password}`);
  }
}

@Service()
export class AuthService {
  private attempts = new Map<string, number[]>();

  async login(password: string, ip: string): Promise<string> {
    const now = Date.now();
    const hits = (this.attempts.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (hits.length >= RATE_LIMIT_MAX) {
      this.attempts.set(ip, hits);
      throw new HttpError(429, '尝试次数过多，请稍后再试');
    }
    hits.push(now);
    this.attempts.set(ip, hits);

    const user = await prisma.user.findUnique({ where: { id: 1 } });
    const ok = user !== null && (await verifyPassword(user.passwordHash, password));
    if (!ok) throw new HttpError(401, '密码错误');

    this.attempts.delete(ip);
    return signToken(1);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: 1 } });
    if (!user || !(await verifyPassword(user.passwordHash, oldPassword))) {
      throw new HttpError(401, '原密码错误');
    }
    await prisma.user.update({
      where: { id: 1 },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return signToken(1);
  }
}
