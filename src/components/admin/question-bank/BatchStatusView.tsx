import React, { useEffect, useState } from 'react';

interface BatchStatusViewProps {
  theme: string;
  apiFetch: any;
  refreshKey?: number;
}

export const BatchStatusView: React.FC<BatchStatusViewProps> = ({ theme, apiFetch, refreshKey }) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const activeBatches = batches.filter(b => b.status === 'pending' || b.status === 'processing');
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
          const isCompleted = b.status === 'completed' || progress >= 100;
          const isFailed = b.status === 'failed';
          return (
            <div key={b.id} className="p-3 bg-gray-950/40 rounded-xl border border-gray-850/60 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold font-mono">{b.taskCode} • <span className="text-gray-400">{b.difficulty}</span></p>
                  <p className="text-[10px] text-gray-500">{new Date(b.createdAt).toLocaleString()} • Requested: {total}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${
                    isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                    isFailed ? 'bg-red-500/10 text-red-400' :
                    'bg-blue-500/10 text-blue-400 animate-pulse'
                  }`}>
                    {isCompleted ? 'Completed' : isFailed ? 'Failed' : b.status}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isFailed ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{progress}% complete</span>
                <span>Ready: {b.readyCount || 0} | Fail: {b.failedCount || 0}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
