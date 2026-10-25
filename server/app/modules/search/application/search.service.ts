import { Service } from 'typedi';
import { prisma } from '../../../shared/prisma';
import { EntryService } from '../../entries/application/entry.service';
import { Inject } from 'typedi';

export interface SearchResultItem {
  id: string;
  date: string;
  title: string;
  mood: string | null;
  weather: string | null;
  tags: { id: string; name: string; color: string | null }[];
  snippet: string;
}

@Service()
export class SearchService {
  @Inject(() => EntryService)
  private entries!: EntryService;

  /**
   * FTS5 trigram 全文搜索；查询词不足 3 字符时退化为 LIKE 子串匹配。
   * snippet 用 <mark> 标记命中片段，前端按标记拆分渲染（不做 HTML 注入）。
   */
  async search(q: string, limit = 50): Promise<SearchResultItem[]> {
    const query = q.trim();
    if (!query) return [];

    let hits: { id: string; snippet: string }[];
    if ([...query].length >= 3) {
      const match = `"${query.replace(/"/g, '""')}"`;
      const rows = await prisma.$queryRaw<{ id: string; snippet: string }[]>`
        SELECT entry_id AS id,
               snippet(entries_fts, 1, '<mark>', '</mark>', '…', 32) AS snippet
        FROM entries_fts
        WHERE entries_fts MATCH ${match}
        ORDER BY rank
        LIMIT ${limit}`;
      hits = rows;
    } else {
      const rows = await prisma.entry.findMany({
        where: { searchText: { contains: query } },
        select: { id: true, searchText: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      });
      hits = rows.map((r) => ({ id: r.id, snippet: this.makeLikeSnippet(r.searchText, query) }));
    }
    if (hits.length === 0) return [];

    const entries = await Promise.all(
      hits.map(async (h) => this.entries.get(h.id).catch(() => null))
    );
    return hits
      .map((h, i) => {
        const e = entries[i];
        if (!e) return null;
        return {
          id: e.id,
          date: e.date,
          title: e.title,
          mood: e.mood,
          weather: e.weather,
          tags: e.tags,
          snippet: h.snippet,
        };
      })
      .filter((x): x is SearchResultItem => x !== null);
  }

  private makeLikeSnippet(text: string, query: string): string {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text.slice(0, 80);
    const start = Math.max(0, idx - 24);
    const end = Math.min(text.length, idx + query.length + 40);
    const hit = text.slice(idx, idx + query.length);
    return `${start > 0 ? '…' : ''}${text.slice(start, idx)}<mark>${hit}</mark>${text.slice(idx + query.length, end)}${end < text.length ? '…' : ''}`;
  }
}
