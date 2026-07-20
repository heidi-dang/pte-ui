import type { MockTaskRendererProps } from '.';
import { splitPromptIntoBlankParts, normalizeBlankOptions } from '../../../practice/utils/blanks';

export function FillBlankRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  const blanks = (typeof response === 'object' && response?.blanks) ? response.blanks : {};

  const setBlank = (key: number, val: string) => {
    if (status === 'completed') return;
    onChange({ kind: 'blanks', blanks: { ...blanks, [String(key)]: val } });
  };

  const promptText = question.promptText || '';
  const parts = splitPromptIntoBlankParts(promptText);
  const blankCount = Math.max(0, parts.length - 1);

  if (blankCount === 0) {
    const rawOptions = question.optionsJson ? (() => {
      try { return JSON.parse(question.optionsJson) as string[]; } catch { return []; }
    })() : [];
    if (rawOptions.length > 0) {
      return (
        <div className="space-y-3">
          {rawOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-6 shrink-0">{i + 1}.</span>
              <select
                className="flex-1 rounded-lg border border-dark-border bg-dark-surface px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-60"
                value={blanks[String(i)] || ''}
                onChange={(e) => setBlank(i, e.target.value)}
                disabled={status === 'completed'}
              >
                <option value="">Select...</option>
                <option value={opt}>{opt}</option>
              </select>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm text-gray-400">
        {promptText}
      </div>
    );
  }

  return (
    <div className="text-sm leading-relaxed text-gray-300">
      {parts.map((part, idx, arr) => {
        if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
        const opts = normalizeBlankOptions(question as unknown as Record<string, unknown>, idx);
        return (
          <span key={idx}>
            <span>{part}</span>
            {opts.length > 0 ? (
              <span className="relative inline-flex mx-1">
                <select
                  value={blanks[String(idx)] || ''}
                  onChange={(e) => setBlank(idx, e.target.value)}
                  disabled={status === 'completed'}
                  className="appearance-none px-3 py-1.5 pr-8 rounded-lg border bg-dark-surface text-emerald-400 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select...</option>
                  {opts.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </span>
            ) : (
              <input
                className="mx-1 px-2 py-1 w-28 rounded-lg border bg-dark-surface text-emerald-400 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-600"
                value={blanks[String(idx)] || ''}
                onChange={(e) => setBlank(idx, e.target.value)}
                placeholder="___"
                disabled={status === 'completed'}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
