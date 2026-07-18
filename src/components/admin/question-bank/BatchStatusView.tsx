import React, { useEffect, useState } from 'react';

interface BatchStatusViewProps {
  theme: string;
  apiFetch: any;
}

export const BatchStatusView: React.FC<BatchStatusViewProps> = ({ theme, apiFetch }) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/question-bank/batches');
      setBatches(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    const interval = setInterval(loadBatches, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [apiFetch]);

  if (batches.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={`p-5 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
      <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex justify-between items-center">
        <span>Recent Generation Batches</span>
        <button onClick={loadBatches} className="text-blue-400 hover:text-blue-300">Refresh</button>
      </h4>
      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        {batches.map(b => (
          <div key={b.id} className="p-3 bg-gray-950/40 rounded-xl border border-gray-850/60 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold font-mono">{b.taskCode} • <span className="text-gray-400">{b.difficulty}</span></p>
              <p className="text-[10px] text-gray-500">{new Date(b.createdAt).toLocaleString()} • Requested: {b.requestedCount}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${
                b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                b.status === 'queued' || b.status === 'generating' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {b.status}
              </span>
              <p className="text-[10px] font-mono text-gray-400 mt-1">Ready: {b.readyCount} | Fail: {b.failedCount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
