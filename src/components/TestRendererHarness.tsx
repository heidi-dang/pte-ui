import { useEffect, useState } from 'react';
import { getMockTaskRenderer, MOCK_TASK_RENDERER_CODES } from './mock-exam/renderers/registry';

export function TestRendererHarness() {
  const [results, setResults] = useState<{ code: string; mounted: boolean; error?: string }[]>([]);
  const [allMounted, setAllMounted] = useState(false);

  useEffect(() => {
    const codes = MOCK_TASK_RENDERER_CODES;
    const res: typeof results = [];
    for (const code of codes) {
      try {
        const Renderer = getMockTaskRenderer(code);
        if (Renderer) {
          res.push({ code, mounted: true });
        } else {
          res.push({ code, mounted: false, error: 'No renderer found' });
        }
      } catch (e: any) {
        res.push({ code, mounted: false, error: e.message });
      }
    }
    setResults(res);
    setAllMounted(res.every(r => r.mounted));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 12 }}>
      <h1>Mock Exam Renderer Harness</h1>
      {allMounted ? (
        <p style={{ color: 'green', fontWeight: 'bold' }}>All {results.length} renderers resolved successfully</p>
      ) : (
        <p style={{ color: 'red', fontWeight: 'bold' }}>Some renderers failed to resolve</p>
      )}
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', marginTop: 16 }}>
        <thead><tr><th>Code</th><th>Status</th><th>Error</th></tr></thead>
        <tbody>
          {results.map(r => (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.mounted ? '✅' : '❌'}</td>
              <td>{r.error || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
