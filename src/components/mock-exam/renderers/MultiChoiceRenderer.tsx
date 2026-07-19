import { type MockTaskRendererProps } from './index';

export function MultiChoiceRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  const options = question.optionsJson ? (JSON.parse(question.optionsJson) as string[]) : [];
  const selected = (typeof response === 'object' && Array.isArray(response?.selected))
    ? response.selected
    : (Array.isArray(response?.selectedMultiple) ? response.selectedMultiple : []);

  const toggle = (opt: string) => {
    if (status === 'completed') return;
    const next = selected.includes(opt)
      ? selected.filter((s: string) => s !== opt)
      : [...selected, opt];
    onChange({ kind: 'multi_choice', selected: next });
  };

  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => toggle(opt)}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
            selected.includes(opt)
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-dark-border bg-dark-surface text-gray-300 hover:border-gray-600'
          } ${status === 'completed' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={status === 'completed'}
        >
          <span className="mr-2">{selected.includes(opt) ? '☑' : '☐'}</span>
          {opt}
        </button>
      ))}
    </div>
  );
}
