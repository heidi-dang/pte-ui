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

  const handleGenerateBatch = async (params: { taskCode: string; section: string; topic: string; difficulty: string; requestKey: string }) => {
    const res = await apiFetch('/api/admin/question-bank/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.success) throw new Error('Failed to generate');
    setSuccessMsg('Generation batch queued. Processing started...');
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
      />
    </div>
  );
};
