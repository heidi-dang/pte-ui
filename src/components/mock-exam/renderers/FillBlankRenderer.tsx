import { type MockTaskRendererProps } from './index';

export function FillBlankRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  const blanks = (typeof response === 'object' && response?.blanks) ? response.blanks : {};
  const options = question.optionsJson ? (JSON.parse(question.optionsJson) as string[]) : [];

  const setBlank = (key: string, val: string) => {
    if (status === 'completed') return;
    onChange({ kind: 'blanks', blanks: { ...blanks, [key]: val } });
  };

  if (options.length > 0) {
    return (
      <div className="space-y-3">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-6 shrink-0">{i + 1}.</span>
            <input
              className="flex-1 rounded-lg border border-dark-border bg-dark-surface px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              value={blanks[String(i)] || ''}
              onChange={(e) => setBlank(String(i), e.target.value)}
              placeholder="Type answer..."
              disabled={status === 'completed'}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm text-gray-400">
      {question.promptText}
    </div>
  );
}
