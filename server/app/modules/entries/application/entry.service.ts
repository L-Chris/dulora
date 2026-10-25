import { Service } from 'typedi';
import { NotFoundError, BadRequestError } from 'routing-controllers';
import { prisma } from '../../../shared/prisma';
import { dateInTz, isValidDateStr, monthRange } from '../../../shared/day';
import { buildSearchText } from './block-text';
import { SettingsService } from '../../settings/application/settings.service';
import { Inject } from 'typedi';
import type { Prisma } from '@prisma/client';

const tagsInclude = { tags: { include: { tag: true } } } satisfies Prisma.EntryInclude;

export interface EntryRecord {
  id: string;
  date: string;
  title: string;
  content: string;
  searchText: string;
  mood: string | null;
  weather: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; name: string; color: string | null } }[];
}

export interface EntryInput {
  date?: string;
  title?: string;
  content: string;
  mood?: string | null;
  weather?: string | null;
  tagIds?: string[];
}

export interface ListParams {
  from?: string;
  to?: string;
  tagId?: string;
  mood?: string;
  page: number;
  pageSize: number;
}

function toSummary(e: EntryRecord) {
  return {
    id: e.id,
    date: e.date,
    title: e.title,
    excerpt: e.searchText.slice(0, 160),
    mood: e.mood,
    weather: e.weather,
    tags: e.tags.map((t) => t.tag),
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

function toDetail(e: EntryRecord) {
  return {
    id: e.id,
    date: e.date,
    title: e.title,
    content: e.content,
    mood: e.mood,
    weather: e.weather,
    tags: e.tags.map((t) => t.tag),
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

@Service()
export class EntryService {
  @Inject(() => SettingsService)
  private settings!: SettingsService;

  async list(params: ListParams) {
    const where: Prisma.EntryWhereInput = {};
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = params.from;
      if (params.to) where.date.lte = params.to;
    }
    if (params.mood) where.mood = params.mood;
    if (params.tagId) where.tags = { some: { tagId: params.tagId } };

    const [total, rows] = await prisma.$transaction([
      prisma.entry.count({ where }),
      prisma.entry.findMany({
        where,
        include: tagsInclude,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return {
      items: (rows as EntryRecord[]).map(toSummary),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async get(id: string) {
    const entry = await prisma.entry.findUnique({ where: { id }, include: tagsInclude });
    if (!entry) throw new NotFoundError('日记不存在');
    return toDetail(entry as EntryRecord);
  }

  async getByDate(date: string): Promise<EntryRecord[]> {
    const rows = await prisma.entry.findMany({
      where: { date },
      include: tagsInclude,
      orderBy: { createdAt: 'asc' },
    });
    return rows as EntryRecord[];
  }

  async create(input: EntryInput) {
    const timezone = await this.settings.getTimezone();
    const date = input.date ?? dateInTz(timezone);
    if (!isValidDateStr(date)) throw new BadRequestError('date 格式应为 yyyy-MM-dd');
    const tagIds = await this.filterExistingTags(input.tagIds);

    const entry = await prisma.entry.create({
      data: {
        date,
        title: input.title ?? '',
        content: input.content,
        searchText: buildSearchText(input.title ?? '', input.content),
        mood: input.mood ?? null,
        weather: input.weather ?? null,
        tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: tagsInclude,
    });
    return toDetail(entry as EntryRecord);
  }

  async update(id: string, input: Partial<EntryInput>) {
    const existing = await prisma.entry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('日记不存在');

    const data: Prisma.EntryUpdateInput = {};
    if (input.date !== undefined) {
      if (!isValidDateStr(input.date)) throw new BadRequestError('date 格式应为 yyyy-MM-dd');
      data.date = input.date;
    }
    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) data.content = input.content;
    if (input.mood !== undefined) data.mood = input.mood;
    if (input.weather !== undefined) data.weather = input.weather;
    if (input.title !== undefined || input.content !== undefined) {
      data.searchText = buildSearchText(
        input.title ?? existing.title,
        input.content ?? existing.content
      );
    }
    if (input.tagIds !== undefined) {
      const tagIds = await this.filterExistingTags(input.tagIds);
      data.tags = {
        set: tagIds.map((tagId) => ({ entryId_tagId: { entryId: id, tagId } })),
      };
    }

    const entry = await prisma.entry.update({ where: { id }, data, include: tagsInclude });
    return toDetail(entry as EntryRecord);
  }

  async remove(id: string): Promise<void> {
    const result = await prisma.entry.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundError('日记不存在');
  }

  /** 月历聚合：[{ date, count, moods, entries: [{ id, title, mood, weather }] }] */
  async calendar(year: number, month: number) {
    if (!(month >= 1 && month <= 12) || !(year >= 1970 && year <= 9999)) {
      throw new BadRequestError('year/month 参数不合法');
    }
    const { from, to } = monthRange(year, month);
    const rows = await prisma.entry.findMany({
      where: { date: { gte: from, lte: to } },
      select: { id: true, date: true, title: true, mood: true, weather: true, createdAt: true },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    const byDate = new Map<
      string,
      { date: string; count: number; moods: string[]; entries: typeof rows }
    >();
    for (const row of rows) {
      let day = byDate.get(row.date);
      if (!day) {
        day = { date: row.date, count: 0, moods: [], entries: [] };
        byDate.set(row.date, day);
      }
      day.count += 1;
      if (row.mood && !day.moods.includes(row.mood)) day.moods.push(row.mood);
      day.entries.push(row);
    }
    return [...byDate.values()];
  }

  private async filterExistingTags(tagIds?: string[]): Promise<string[]> {
    if (!tagIds?.length) return [];
    const unique = [...new Set(tagIds)];
    const tags = await prisma.tag.findMany({ where: { id: { in: unique } }, select: { id: true } });
    const existing = new Set(tags.map((t) => t.id));
    return unique.filter((id) => existing.has(id));
  }
}
