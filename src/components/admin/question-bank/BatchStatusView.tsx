import React, { useEffect, useState } from 'react';

interface BatchStatusViewProps {
  theme: string;
  apiFetch: any;
  refreshKey?: number;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'failed': return 'Failed';
    case 'partial_failed': return 'Partial failed';
    case 'completed': return 'Completed';
    case 'queued': return 'Queued';
    case 'generating': return 'Generating';
    case 'validating': return 'Validating';
    default: return status;
  }
}

function computeDisplayStatus(b: any): { label: string; isFailed: boolean; isCompleted: boolean; isActive: boolean } {
  const status = b.status;
  if (status === 'failed') return { label: 'Failed', isFailed: true, isCompleted: false, isActive: false };
  if (status === 'partial_failed') return { label: 'Partial failed', isFailed: true, isCompleted: false, isActive: false };
  if (status === 'completed') return { label: 'Completed', isCompleted: true, isFailed: false, isActive: false };
  return { label: statusLabel(status), isFailed: false, isCompleted: false, isActive: true };
}

export const BatchStatusView: React.FC<BatchStatusViewProps> = ({ theme, apiFetch, refreshKey }) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [failureDetails, setFailureDetails] = useState<any>(null);

  const loadBatches = async () => {
    setError('');
    try {
      const data = await apiFetch('/api/admin/question-bank/batches');
      setBatches(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load generation batches');
    }
  };

  useEffect(() => {
    loadBatches();
  }, [refreshKey, apiFetch]);

  useEffect(() => {
    const interval = setInterval(loadBatches, 3000);
    return () => clearInterval(interval);
  }, []);

  if (batches.length === 0 && !loading && !error) {
    return null;
  }

  const loadFailureDetails = async (batchId: string) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      setFailureDetails(null);
      return;
    }
    try {
      const data = await apiFetch(`/api/admin/question-bank/batches/${batchId}`);
      setExpandedBatch(batchId);
      setFailureDetails(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load batch details');
    }
  };

  return (
    <div className={`p-5 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
      <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex justify-between items-center">
        <span>Recent Generation Batches</span>
        <button onClick={loadBatches} className="text-blue-400 hover:text-blue-300">Refresh</button>
      </h4>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-3">
          {error}
        </div>
      )}

      {(() => {
        const activeBatches = batches.filter(b => ['queued', 'generating', 'validating'].includes(b.status));
        if (activeBatches.length > 1) {
          const totalRequested = activeBatches.reduce((acc, b) => acc + (b.totalCount || b.requestedCount || 1), 0);
          const totalDone = activeBatches.reduce((acc, b) => acc + (b.readyCount || 0) + (b.failedCount || 0), 0);
          const progress = totalRequested > 0 ? Math.round((totalDone / totalRequested) * 100) : 0;
          return (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Overall Bulk Progress ({activeBatches.length} Tasks)</span>
                <span className="text-xs font-bold text-blue-400">{progress}%</span>
              </div>
              <div className="w-full bg-blue-950/50 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-blue-500 transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="text-[10px] text-blue-400/70 text-right mt-1">
                {totalDone} of {totalRequested} questions generated
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
        {batches.map(b => {
          const total = b.totalCount || b.requestedCount || 1;
          const done = (b.readyCount || 0) + (b.failedCount || 0);
          const progress = Math.round((done / total) * 100);
          const display = computeDisplayStatus(b);
          return (
            <div key={b.id} className="p-3 bg-gray-950/40 rounded-xl border border-gray-850/60 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold font-mono">{b.taskCode} • <span className="text-gray-400">{b.difficulty}</span></p>
                  <p className="text-[10px] text-gray-500">{new Date(b.createdAt).toLocaleString()} • Requested: {total}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${
                    display.isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                    display.isFailed ? 'bg-red-500/10 text-red-400' :
                    'bg-blue-500/10 text-blue-400 animate-pulse'
                  }`}>
                    {display.label}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    display.isFailed ? 'bg-red-500' : display.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{progress}% complete</span>
                <span>Ready: {b.readyCount || 0} | Fail: {b.failedCount || 0}</span>
              </div>
              {(b.failedCount > 0 || b.status === 'failed' || b.status === 'partial_failed') && (
                <div className="mt-2">
                  <button
                    onClick={() => loadFailureDetails(b.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 underline"
                  >
                    {expandedBatch === b.id ? 'Hide failures' : 'View failures'}
                  </button>
                  {expandedBatch === b.id && failureDetails?.candidates && (
                    <div className="mt-2 p-2 bg-red-950/30 rounded border border-red-900/50 max-h-40 overflow-y-auto">
                      {(() => {
                        const grouped = new Map<string, { count: number; slots: number[] }>();
                        for (const c of failureDetails.candidates) {
                          const reason = c.failureReason || c.status;
                          const entry = grouped.get(reason) || { count: 0, slots: [] };
                          entry.count++;
                          entry.slots.push(c.slotNumber);
                          grouped.set(reason, entry);
                        }
                        return Array.from(grouped.entries()).map(([reason, info]) => (
                          <div key={reason} className="mb-1 last:mb-0">
                            <span className="text-red-300 font-bold">{info.count}x</span>{' '}
                            <span className="text-gray-300">{reason}</span>
                            <span className="text-gray-500 ml-1">(slots: {info.slots.join(', ')})</span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
