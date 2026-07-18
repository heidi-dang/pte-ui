import React from 'react';

interface QuestionTableProps {
  theme: string;
  items: any[];
  onAction: (id: string, action: 'publish' | 'draft' | 'archive') => void;
  onEdit: (q: any) => void;
  onPreview: (q: any) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({ theme, items, onAction, onEdit, onPreview }) => {
  return (
    <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={`border-b font-mono text-gray-500 uppercase tracking-wider text-[10px] ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
            <th className="p-4">Title</th>
            <th className="p-4">Task</th>
            <th className="p-4">Section</th>
            <th className="p-4">Review</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-850">
          {items.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-xs">No items found.</td></tr>
          )}
          {items.map((q: any) => (
            <tr key={q.id} className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-bold max-w-xs truncate">{q.title}</td>
              <td className="p-4 font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{q.taskCode}</span>
              </td>
              <td className="p-4 text-gray-400">{q.section}</td>
              <td className="p-4 font-mono text-[10px]">
                {q.reviewStatus === 'approved' && <span className="text-green-400">Approved</span>}
                {q.reviewStatus === 'rejected' && <span className="text-red-400">Rejected</span>}
                {q.reviewStatus === 'pending_review' && <span className="text-blue-400">Pending Review</span>}
                {q.reviewStatus === 'pending_review_warning' && <span className="text-orange-400">Warning (Review)</span>}
              </td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  q.status === 'published' ? 'bg-green-500/10 text-green-400' :
                  q.status === 'archived' ? 'bg-gray-500/10 text-gray-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>{q.status}</span>
              </td>
              <td className="p-3 text-right space-x-1">
                {q.status !== 'published' && <button onClick={() => onAction(q.id, 'publish')} className="p-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded text-[9px]" title="Publish">Pub</button>}
                {q.status === 'published' && <button onClick={() => onAction(q.id, 'draft')} className="p-1 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-white rounded text-[9px]" title="Unpublish">Draft</button>}
                {q.status !== 'archived' && <button onClick={() => onAction(q.id, 'archive')} className="p-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[9px]" title="Archive">Arc</button>}
                <button onClick={() => onEdit(q)} className="p-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded text-[9px]" title="Edit">Edit</button>
                <button onClick={() => onPreview(q)} className="p-1 bg-gray-500/10 hover:bg-gray-500 text-gray-400 hover:text-white rounded text-[9px]" title="Preview">Prev</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
