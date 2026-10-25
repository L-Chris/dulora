import { prisma } from './prisma';

/**
 * FTS5 全文索引初始化（幂等）。
 * Prisma 不管理虚拟表，这里用原生 SQL：
 * - entries_fts：trigram tokenizer，支持 CJK 子串匹配（要求 SQLite ≥ 3.34）
 * - 触发器与 "Entry" 表保持同步（脚本/导入工具直接写表也不会漏同步）
 * - 行数不一致时全量重建（自愈，例如触发器创建前的历史数据）
 */
export async function ensureFts(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(entry_id UNINDEXED, text, tokenize = 'trigram case_sensitive 0')`
  );
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER IF NOT EXISTS entries_fts_ai AFTER INSERT ON "Entry" BEGIN
       INSERT INTO entries_fts(entry_id, text) VALUES (new.id, COALESCE(new.searchText, ''));
     END`
  );
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER IF NOT EXISTS entries_fts_au AFTER UPDATE OF searchText ON "Entry" BEGIN
       UPDATE entries_fts SET text = COALESCE(new.searchText, '') WHERE entry_id = new.id;
     END`
  );
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER IF NOT EXISTS entries_fts_ad AFTER DELETE ON "Entry" BEGIN
       DELETE FROM entries_fts WHERE entry_id = old.id;
     END`
  );

  const [entryCount] = await prisma.$queryRawUnsafe<{ c: number }[]>(
    `SELECT COUNT(*) AS c FROM "Entry"`
  );
  const [ftsCount] = await prisma.$queryRawUnsafe<{ c: number }[]>(
    `SELECT COUNT(*) AS c FROM entries_fts`
  );
  if (Number(entryCount.c) !== Number(ftsCount.c)) {
    console.log('[diary] entries_fts 与 Entry 行数不一致，全量重建 FTS 索引');
    await prisma.$executeRawUnsafe(`DELETE FROM entries_fts`);
    await prisma.$executeRawUnsafe(
      `INSERT INTO entries_fts(entry_id, text) SELECT id, COALESCE(searchText, '') FROM "Entry"`
    );
  }
}
