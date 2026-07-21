import React, { useState } from 'react';
import { QuestionBankToolbar } from './QuestionBankToolbar';
import { GenerationDialog } from './GenerationDialog';
import { ManualQuestionModal } from './ManualQuestionModal';
import { QuestionTable } from './QuestionTable';
import { BatchStatusView } from './BatchStatusView';

interface QuestionBankPanelProps {
  theme: string;
  apiFetch: any;
  items: any[];
  onRefresh: () => void;
  onPreview?: (q: any) => void;
}

export const QuestionBankPanel: React.FC<QuestionBankPanelProps> = ({ theme, apiFetch, items, onRefresh, onPreview }) => {
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [batchRefreshKey, setBatchRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleGenerateBatch = async (params: { tasks: { taskCode: string; section: string; count: number }[]; topic: string; difficulty: string; requestKey: string }) => {
    const res = await apiFetch('/api/admin/question-bank/bulk-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.success) {
      const msg = res.error || res.message || 'Failed to queue bulk generation';
      if (msg.includes('rate_limit') || msg.includes('429')) {
        throw new Error('Too many generation requests. Please wait before trying again.');
      }
      if (msg.includes('generation_in_progress')) {
        throw new Error(res.message || 'A generation batch is already running. Please wait for it to finish.');
      }
      throw new Error(msg);
    }
    setSuccessMsg('Bulk generation batches queued. Processing started...');
    setBatchRefreshKey(k => k + 1);
    onRefresh();
  };

  const handleSaveManual = async (data: any, id?: string) => {
    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/api/admin/question-bank/${id}` : '/api/admin/question-bank';
    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.success) throw new Error('Failed to save');
    onRefresh();
  };

  const handleAction = async (id: string, action: 'publish' | 'draft' | 'archive') => {
    if (!confirm(`Confirm ${action} for this question?`)) return;
    try {
      await apiFetch(`/api/admin/question-bank/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'draft' ? 'draft' : action === 'publish' ? 'published' : 'archived' }),
      });
      onRefresh();
    } catch (err: any) {
      console.error('Action failed:', err);
    }
  };

  const handleBulkAction = async (action: 'publish' | 'draft' | 'archive' | 'delete' | 'review_approve') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} question(s)?`)) return;
    } else {
      if (!confirm(`Apply ${action} to ${selectedIds.length} question(s)?`)) return;
    }

    try {
      if (action === 'review_approve') {
        await apiFetch('/api/admin/question-bank/bulk-review', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: selectedIds, action: 'approve' }),
        });
      } else {
        await apiFetch('/api/admin/question-bank/bulk-action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: selectedIds, action }),
        });
      }
      setSelectedIds([]);
      setSuccessMsg(`Bulk ${action} successful.`);
      onRefresh();
    } catch (err: any) {
      console.error('Bulk action failed:', err);
      alert('Bulk action failed');
    }
  };

  const handleEdit = (q: any) => {
    setEditingItem(q);
    setShowManualModal(true);
    setShowAiModal(false);
  };

  const handlePreview = (q: any) => {
    if (onPreview) {
      onPreview(q);
    } else {
      alert(`Previewing: ${q.title}\nTask: ${q.taskCode}\nPrompt: ${q.promptText}`);
    }
  };

  return (
    <div className="space-y-4">
      <QuestionBankToolbar 
        onNewManual={() => {
          setEditingItem(null);
          setShowManualModal(!showManualModal);
          setShowAiModal(false);
        }}
        onNewAi={() => {
          setShowAiModal(!showAiModal);
          setShowManualModal(false);
        }}
      />

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-300 ml-2">✕</button>
        </div>
      )}

      <BatchStatusView theme={theme} apiFetch={apiFetch} refreshKey={batchRefreshKey} />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
          <span className="text-xs font-bold text-blue-400">{selectedIds.length} item(s) selected:</span>
          <button onClick={() => handleBulkAction('publish')} className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded text-[10px] font-bold transition-colors">Publish All</button>
          <button onClick={() => handleBulkAction('draft')} className="px-3 py-1 bg-gray-500/10 hover:bg-gray-500 text-gray-400 hover:text-white rounded text-[10px] font-bold transition-colors">Draft All</button>
          <button onClick={() => handleBulkAction('archive')} className="px-3 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded text-[10px] font-bold transition-colors">Archive All</button>
          <button onClick={() => handleBulkAction('review_approve')} className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded text-[10px] font-bold transition-colors">Review Approve All</button>
          <button onClick={() => handleBulkAction('delete')} className="px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[10px] font-bold transition-colors ml-auto">Delete All</button>
        </div>
      )}

      {showAiModal && (
        <GenerationDialog 
          theme={theme} 
          onClose={() => setShowAiModal(false)}
          onSubmit={handleGenerateBatch}
        />
      )}

      {showManualModal && (
        <ManualQuestionModal 
          theme={theme}
          initialData={editingItem}
          onClose={() => {
            setShowManualModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveManual}
        />
      )}

      <QuestionTable 
        theme={theme}
        items={items}
        onAction={handleAction}
        onEdit={handleEdit}
        onPreview={handlePreview}
        selectedIds={selectedIds}
        onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
        onSelectAll={(allIds) => setSelectedIds(allIds)}
      />
    </div>
  );
};
