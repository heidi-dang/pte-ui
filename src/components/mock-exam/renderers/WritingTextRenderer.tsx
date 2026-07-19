import { type MockTaskRendererProps } from './index';

export function WritingTextRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  return (
    <div className="space-y-4">
      {question.passageText && (
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm leading-relaxed text-gray-300">
          {question.passageText}
        </div>
      )}
      <textarea
        className="w-full min-h-[200px] rounded-xl border border-dark-border bg-dark-surface p-4 text-sm text-gray-200 placeholder-gray-600 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        placeholder="Type your response here..."
        value={typeof response === 'object' && response?.text ? response.text : (response || '')}
        onChange={(e) => onChange(typeof response === 'object' && response?.kind ? { kind: 'text', text: e.target.value } : e.target.value)}
        disabled={status === 'completed'}
      />
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>{question.instruction}</span>
        <span>{typeof response === 'object' && response?.text ? response.text.length : (response || '').length} characters</span>
      </div>
    </div>
  );
}
