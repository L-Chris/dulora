/**
 * BlockNote 文档 JSON → 纯文本投影（searchText / excerpt 数据源）。
 * 容错解析：任何结构变化都不应导致保存失败。
 */
export function blocksToPlainText(input: unknown): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === 'string') parts.push(obj.text);
    if (obj.content) walk(obj.content);
    if (obj.children) walk(obj.children);
    if (obj.items) walk(obj.items);
  };
  walk(input);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function parseBlocks(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function buildSearchText(title: string, content: string): string {
  const text = blocksToPlainText(parseBlocks(content));
  return `${title} ${text}`.replace(/\s+/g, ' ').trim();
}
