import { Service } from 'typedi';
import { BadRequestError, HttpError } from 'routing-controllers';
import { prisma } from '../../../shared/prisma';

@Service()
export class TagService {
  async list() {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { entries: true } } },
    });
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      entryCount: t._count.entries,
      createdAt: t.createdAt,
    }));
  }

  /** 幂等创建：同名标签直接返回已存在的 */
  async create(name: string, color?: string | null) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestError('标签名不能为空');
    const existing = await prisma.tag.findUnique({ where: { name: trimmed } });
    if (existing) return existing;
    return prisma.tag.create({ data: { name: trimmed, color: color ?? null } });
  }

  async update(id: string, name?: string, color?: string | null) {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) throw new BadRequestError('标签不存在');
    const data: { name?: string; color?: string | null } = {};
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) throw new BadRequestError('标签名不能为空');
      data.name = trimmed;
    }
    if (color !== undefined) data.color = color;
    try {
      return await prisma.tag.update({ where: { id }, data });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new HttpError(409, '标签名已存在');
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await prisma.tag.deleteMany({ where: { id } });
    if (result.count === 0) throw new BadRequestError('标签不存在');
  }
}
