import { useEffect, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useTheme } from '../../hooks/useTheme';

function safeParse(content: string | undefined): PartialBlock[] | undefined {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as PartialBlock[]) : undefined;
  } catch {
    return undefined;
  }
}

interface DiaryEditorProps {
  initialContent?: string;
  onChange: (blocksJson: string) => void;
}

/**
 * BlockNote 封装：非受控编辑器，initialContent 只在挂载时生效。
 * 父组件通过 key 控制重建（例如从「新建」切换到「编辑已有」）。
 */
export function DiaryEditor({ initialContent, onChange }: DiaryEditorProps) {
  const { theme } = useTheme();
  const editor = useCreateBlockNote({ initialContent: safeParse(initialContent) });

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return editor.onChange(() => {
      onChangeRef.current(JSON.stringify(editor.document));
    });
  }, [editor]);

  return (
    <div className="diary-editor">
      <BlockNoteView editor={editor} theme={theme === 'dark' ? 'dark' : 'light'} />
    </div>
  );
}

export function editorHasText(blocksJson: string): boolean {
  try {
    const blocks = JSON.parse(blocksJson);
    const parts: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === 'string') return parts.push(node);
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      const obj = node as Record<string, unknown>;
      if (typeof obj.text === 'string') parts.push(obj.text);
      if (obj.content) walk(obj.content);
      if (obj.children) walk(obj.children);
    };
    walk(blocks);
    return parts.join('').trim().length > 0;
  } catch {
    return false;
  }
}
