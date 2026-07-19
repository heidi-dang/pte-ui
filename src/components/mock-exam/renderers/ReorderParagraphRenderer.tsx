import { useCallback } from 'react';
import { type MockTaskRendererProps } from './index';

export function ReorderParagraphRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  const items = (typeof response === 'object' && Array.isArray(response?.ordered))
    ? response.ordered
    : (Array.isArray(response?.reorderedList) ? response.reorderedList :
       question.optionsJson ? (JSON.parse(question.optionsJson) as string[]) : []);

  const moveItem = useCallback((from: number, to: number) => {
    if (status === 'completed') return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ kind: 'ordered_list', ordered: next });
  }, [items, status, onChange]);

  const moveUp = (idx: number) => { if (idx > 0) moveItem(idx, idx - 1); };
  const moveDown = (idx: number) => { if (idx < items.length - 1) moveItem(idx, idx + 1); };

  return (
    <div className="space-y-2">
      {items.map((item: string, idx: number) => (
        <div key={idx} className="flex items-center gap-2 rounded-xl border border-dark-border bg-dark-surface p-3">
          <span className="text-[10px] font-mono text-gray-500 w-5 shrink-0">{idx + 1}</span>
          <span className="flex-1 text-sm text-gray-200">{item}</span>
          <div className="flex flex-col gap-1">
            <button onClick={() => moveUp(idx)} disabled={idx === 0 || status === 'completed'}
              className="text-gray-500 hover:text-white disabled:opacity-30 text-xs px-1">▲</button>
            <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1 || status === 'completed'}
              className="text-gray-500 hover:text-white disabled:opacity-30 text-xs px-1">▼</button>
          </div>
        </div>
      ))}
    </div>
  );
}
