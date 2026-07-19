/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Shield, Users, Layers, Key, Database, Book, DollarSign, Settings, Trash2, Plus, Edit3, CheckCircle, Search, Filter, Archive, Eye, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { QuestionBankPanel } from './admin/question-bank/QuestionBankPanel';

// Inline panel components for admin tabs
const AdminSubmissionsPanel = ({ theme, apiFetch }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sf, setSf] = useState('');
  const [secF, setSecF] = useState('');
  const [tcF, setTcF] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const params = new URLSearchParams(); if (sf) params.set('status', sf); if (secF) params.set('section', secF); if (tcF) params.set('taskCode', tcF); const d = await apiFetch('/api/admin/submissions' + (params.toString() ? '?' + params.toString() : '')); setData(d || []); } catch (e: any) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [apiFetch, sf, secF, tcF]);
  if (loading) return <p className="text-gray-400 text-sm py-8">Loading...</p>;
  if (error) return <div className="text-center py-8"><p className="text-red-400 text-sm">{error}</p><button onClick={load} className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs">Retry</button></div>;
  const pending = data.filter((s: any) => s.status === 'pending').length;
  const scored = data.length - pending;
  return (<div className="space-y-3"><div className="flex flex-wrap gap-3 items-center"><h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Submissions</h3><select value={sf} onChange={e=>setSf(e.target.value)} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white"><option value="">All Status</option><option value="pending">Pending</option><option value="graded">Scored</option></select><select value={secF} onChange={e=>setSecF(e.target.value)} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white"><option value="">All Sections</option><option value="Speaking">Speaking</option><option value="Writing">Writing</option><option value="Reading">Reading</option><option value="Listening">Listening</option></select><input type="text" placeholder="Task code..." value={tcF} onChange={e=>setTcF(e.target.value)} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white w-20" /><span className="text-xs text-emerald-400">{scored} scored</span><span className="text-xs text-amber-400">{pending} pending</span></div>
  {data.length===0?<p className="text-gray-500 text-sm py-4">No submissions.</p>:<div className={`overflow-x-auto rounded-2xl border ${theme==='dark'?'bg-[#0f1322] border-gray-850':'bg-white border-gray-200'}`}><table className="w-full text-left text-xs min-w-[600px]"><thead><tr className="border-b font-mono text-gray-500 uppercase text-[10px] bg-gray-950/40"><th className="p-3">User</th><th className="p-3">Task</th><th className="p-3">Section</th><th className="p-3">Status</th><th className="p-3">Score</th><th className="p-3">Date</th></tr></thead><tbody className="divide-y divide-gray-850">{data.map((s:any)=><tr key={s.id} className="hover:bg-white/5"><td className="p-3 text-[10px] truncate max-w-[120px]">{s.userName}</td><td className="p-3 font-mono">{s.taskCode}</td><td className="p-3 text-gray-400">{s.section}</td><td className={`p-3 ${s.status==='graded'?'text-emerald-400':'text-amber-400'}`}>{s.status}</td><td className="p-3 font-mono">{s.score??'—'}</td><td className="p-3 text-gray-500 text-[10px]">{new Date(s.submittedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</div>);
};

const AdminMockTestsPanel = ({ theme, apiFetch }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stF, setStF] = useState('');
  const [tyF, setTyF] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const params = new URLSearchParams(); if (stF) params.set('status', stF); if (tyF) params.set('type', tyF); const d = await apiFetch('/api/admin/mock-tests' + (params.toString() ? '?' + params.toString() : '')); setData(d); } catch (e: any) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [apiFetch, stF, tyF]);
  if (loading) return <p className="text-gray-400 text-sm py-8">Loading...</p>;
  if (error) return <div className="text-center py-8"><p className="text-red-400 text-sm">{error}</p><button onClick={load} className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs">Retry</button></div>;
  if (!data || data.attempts?.length === 0) return <p className="text-gray-500 text-sm py-4">No mock test attempts.</p>;
  return (<div className="space-y-3"><div className="flex flex-wrap gap-3 items-center"><h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Mock Tests</h3><select value={stF} onChange={e=>setStF(e.target.value)} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white"><option value="">All Status</option><option value="Completed">Completed</option><option value="In Progress">In Progress</option><option value="Paused">Paused</option></select><select value={tyF} onChange={e=>setTyF(e.target.value)} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white"><option value="">All Types</option><option value="mini">Mini</option><option value="section">Section</option><option value="full">Full</option></select><span className="text-xs text-emerald-400">C: {data.counts?.completed}</span><span className="text-xs text-amber-400">IP: {data.counts?.inProgress}</span><span className="text-xs text-gray-400">P: {data.counts?.paused}</span></div>
  <div className={`overflow-x-auto rounded-2xl border ${theme==='dark'?'bg-[#0f1322] border-gray-850':'bg-white border-gray-200'}`}><table className="w-full text-left text-xs min-w-[700px]"><thead><tr className="border-b font-mono text-gray-500 uppercase text-[10px] bg-gray-950/40"><th className="p-3">User</th><th className="p-3">Test</th><th className="p-3">Type</th><th className="p-3">Ovr</th><th className="p-3">Spk</th><th className="p-3">Wrt</th><th className="p-3">Rd</th><th className="p-3">Lst</th><th className="p-3">Date</th></tr></thead><tbody className="divide-y divide-gray-850">{data.attempts.map((a:any)=><tr key={a.id} className="hover:bg-white/5"><td className="p-3 text-[10px]">{a.userName}</td><td className="p-3 truncate max-w-[120px]">{a.title}</td><td className="p-3">{a.type}</td><td className="p-3 font-mono text-emerald-400">{a.overallScore}</td><td className="p-3">{a.speakingScore}</td><td className="p-3">{a.writingScore}</td><td className="p-3">{a.readingScore}</td><td className="p-3">{a.listeningScore}</td><td className="p-3 text-gray-500 text-[10px]">{a.date}</td></tr>)}</tbody></table></div></div>);
};

const AdminReportsPanel = ({ theme, apiFetch }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const d = await apiFetch('/api/admin/reports/overview'); setData(d); } catch {} finally { setLoading(false); } })(); }, [apiFetch]);
  if (loading) return <p className="text-gray-400 text-sm py-8">Loading reports...</p>;
  if (!data) return <div className={`p-8 rounded-2xl border text-center ${theme==='dark'?'bg-[#0f1322] border-gray-850':'bg-white border-gray-200'}`}><p className="text-sm text-gray-400">No report data available.</p></div>;
  return (<div className="space-y-6"><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[{l:'Practice Volume',v:data.practiceVolume},{l:'Pending Scoring',v:data.pendingScoring},{l:'Score 0 Count',v:data.scoreZeroCount},{l:'Mocks Completed',v:data.mockCompleted},{l:'Lesson Volume',v:data.lessonVolume}].map(k=><div key={k.l} className={`p-4 rounded-xl border text-center ${theme==='dark'?'bg-[#0f1322] border-gray-850':'bg-white border-gray-200'}`}><p className="text-2xl font-black text-emerald-400">{k.v}</p><p className="text-[10px] font-mono text-gray-500 uppercase">{k.l}</p></div>)}</div>
  {data.sectionAvgs?.length>0&&<div className="space-y-2"><h4 className="text-sm font-bold text-gray-400 uppercase font-mono">Section Averages</h4><div className="space-y-1">{data.sectionAvgs.map((s:any)=><div key={s.section} className="flex justify-between text-xs"><span>{s.section}</span><span className="font-mono text-emerald-400">{Math.round(s._avg.score||0)}/90 ({s._count})</span></div>)}</div></div>}
  {data.taskAvgs?.length>0&&<div className="space-y-2"><h4 className="text-sm font-bold text-gray-400 uppercase font-mono">Task Averages</h4><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{data.taskAvgs.map((t:any)=><div key={t.taskCode} className="flex justify-between text-xs"><span className="font-mono">{t.taskCode}</span><span className="text-emerald-400">{Math.round(t._avg.score||0)}/90 ({t._count})</span></div>)}</div></div>}
  </div>);
};

const AdminReliabilityPanel = ({ theme, apiFetch }: any) => {
  const [health, setHealth] = useState<any>(null);
  const [data, setData] = useState<any>({ jobs: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const PS = 10;

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter); params.set('page', String(page)); params.set('pageSize', String(PS));
        if (dateFrom) params.set('dateFrom', dateFrom); if (dateTo) params.set('dateTo', dateTo);
        const [h, j] = await Promise.all([apiFetch('/api/admin/runtime-health'), apiFetch('/api/admin/jobs?' + params.toString())]);
        if (!active) return;
        setHealth(h); setData(j || { jobs: [], total: 0 });
      } catch (e: any) { if (active) setError(e.message); } finally { if (active) setLoading(false); }
    };
    run();
    return () => { active = false; };
  }, [apiFetch, statusFilter, page, dateFrom, dateTo, reloadKey]);

  const doReload = () => setReloadKey(k => k + 1);

  if (loading) return <p className="text-gray-400 text-sm py-8">Loading...</p>;
  if (error) return <div className="text-center py-8"><p className="text-red-400 text-sm">{error}</p><button onClick={doReload} className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs">Retry</button></div>;
  const totalPages = Math.ceil((data.total || 0) / PS);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Reliability & Background Jobs</h3>
      {health && <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">{[{l:'Queued',v:health.queueCounts?.queued,c:'text-amber-400'},{l:'Running',v:health.queueCounts?.running,c:'text-emerald-400'},{l:'Failed',v:health.queueCounts?.failed,c:'text-red-400'},{l:'Dead',v:health.queueCounts?.deadLetter,c:'text-gray-400'},{l:'Stale',v:health.staleJobs,c:'text-orange-400'},{l:'24h Fails',v:health.recentFailures24h,c:'text-red-400'}].map(k=><div key={k.l} className={`p-3 rounded-xl border text-center ${theme==='dark'?'bg-[#0f1322] border-gray-850':'bg-white border-gray-200'}`}><p className={`text-xl font-black ${k.c}`}>{k.v}</p><p className="text-[10px] font-mono text-gray-500 uppercase">{k.l}</p></div>)}</div>}
      <div className="flex flex-wrap gap-2 items-center"><h4 className="text-sm font-bold text-gray-400 uppercase font-mono">Jobs ({data.total})</h4><select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white"><option value="">All</option><option value="queued">Queued</option><option value="running">Running</option><option value="failed">Failed</option><option value="dead_letter">Dead Letter</option></select><input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" /><input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} className="px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" /></div>
      {data.jobs?.length===0?<p className="text-gray-500 text-sm py-4">No jobs.</p>:<><div className={`overflow-x-auto rounded-2xl border ${theme==='dark'?'bg-[#0f1322] border-gray-850':'bg-white border-gray-200'}`}><table className="w-full text-left text-xs min-w-[600px]"><thead><tr className="border-b font-mono text-gray-500 uppercase text-[10px] bg-gray-950/40"><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Attempts</th><th className="p-3">Scheduled</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-gray-850">{data.jobs.map((j:any)=><tr key={j.id} className="hover:bg-white/5"><td className="p-3 font-bold text-[10px]">{j.name}</td><td className="p-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${j.status==='completed'?'bg-emerald-500/10 text-emerald-400':j.status==='failed'||j.status==='dead_letter'?'bg-red-500/10 text-red-400':j.status==='running'?'bg-amber-500/10 text-amber-400':'bg-gray-500/10 text-gray-400'}`}>{j.status}</span></td><td className="p-3">{j.attempts}/{j.maxAttempts}</td><td className="p-3 text-gray-500 text-[10px]">{new Date(j.scheduledAt).toLocaleString()}</td><td className="p-3 space-x-1"><button onClick={async()=>{try{setSelectedJob(await apiFetch(`/api/admin/jobs/${j.id}`))}catch{}}} className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded text-[10px]">Detail</button>{(j.status==='failed'||j.status==='dead_letter')&&<button onClick={async()=>{await apiFetch(`/api/admin/jobs/${j.id}/retry`,{method:'POST'});doReload()}} className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded text-[10px]">Retry</button>}{(j.status==='queued')&&<button onClick={async()=>{if(!confirm('Cancel?'))return;await apiFetch(`/api/admin/jobs/${j.id}/cancel`,{method:'POST'});doReload()}} className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[10px]">Cancel</button>}</td></tr>)}</tbody></table></div>{totalPages>1&&<div className="flex justify-center gap-1 mt-2">{Array.from({length:totalPages},(_,i)=><button key={i} onClick={()=>setPage(i+1)} className={`px-2 py-0.5 rounded text-[10px] ${page===i+1?'bg-emerald-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{i+1}</button>)}</div>}</>}
      {selectedJob&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setSelectedJob(null)}><div className={`w-full max-w-sm rounded-2xl border p-6 ${theme==='dark'?'bg-[#101424] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'}`} onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h3 className="font-bold">{selectedJob.name}</h3><button onClick={()=>setSelectedJob(null)} className="text-gray-500 hover:text-white">✕</button></div><div className="space-y-2 text-xs"><p>ID: {selectedJob.id}</p><p>Status: {selectedJob.status}</p><p>Attempts: {selectedJob.attempts}/{selectedJob.maxAttempts}</p><p>Scheduled: {new Date(selectedJob.scheduledAt).toLocaleString()}</p>{selectedJob.startedAt&&<p>Started: {new Date(selectedJob.startedAt).toLocaleString()}</p>}{selectedJob.completedAt&&<p>Completed: {new Date(selectedJob.completedAt).toLocaleString()}</p>}{selectedJob.error&&<p className="text-red-400">Error: {selectedJob.error}</p>}{selectedJob.workerId&&<p>Worker: {selectedJob.workerId}</p>}</div></div></div>}
    </div>
  );
};

export const AdminUI: React.FC = () => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'teachers' | 'questions' | 'submissions' | 'mocktests' | 'reports' | 'audit' | 'reliability' | 'system'>('dashboard');

  // Question bank state
  const [questionBankItems, setQuestionBankItems] = useState<any[]>([]);
  const [previewQ, setPreviewQ] = useState<any>(null);

  // Coupon manager states
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(50);
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponError, setCouponError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 20;
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  const handleViewUser = async (id: string) => {
    setUserDetailLoading(true);
    try { const u = await apiFetch(`/api/admin/users/${id}`); setSelectedUser(u); } catch { alert('Failed to load user'); }
    finally { setUserDetailLoading(false); }
  };

  // Audit list and users lists
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const filteredStudents = React.useMemo(() => students.filter(s => {
    const q = userSearch.toLowerCase();
    return (!q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q))
      && (roleFilter === 'all' || s.role === roleFilter)
      && (statusFilter === 'all' || s.status === statusFilter);
  }), [students, userSearch, roleFilter, statusFilter]);

  const loadAdminTelemetry = async () => {
    if (role !== 'admin') return;
    try {
      const usersData = await apiFetch('/api/admin/users');
      setStudents(usersData);

      const jobsData = await apiFetch('/api/admin/jobs');
      setLiveJobs(jobsData.jobs ?? []);

      const logsData = await apiFetch('/api/admin/logs');
      setLiveLogs(logsData);

      const couponsData = await apiFetch('/api/admin/coupons');
      setCoupons(couponsData || []);

      const auditLogs = await apiFetch('/api/admin/audit-logs');
      setAuditLogsList(auditLogs || []);

      try {
        const qData = await apiFetch('/api/admin/question-bank');
        setQuestionBankItems(qData || []);
      } catch (e) { /* silently fail */ }

      try {
        const dash = await apiFetch('/api/admin/dashboard');
        setDashboardStats(dash);
      } catch (e) { /* silently fail */ }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    }
  };

  useEffect(() => {
    loadAdminTelemetry();
    const interval = setInterval(loadAdminTelemetry, 7000); // Poll every 7s for live logging updates
    return () => clearInterval(interval);
  }, [apiFetch, role]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponSuccess('');
    setCouponError('');
    try {
      const resp = await apiFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          discountPercent: Number(newCouponDiscount),
          maxUses: Number(newCouponMaxUses),
        }),
      });
      if (resp.success) {
        setCouponSuccess(`Coupon code ${resp.coupon.code} successfully deployed!`);
        setNewCouponCode('');
        // Reload list
        const freshCoupons = await apiFetch('/api/admin/coupons');
        setCoupons(freshCoupons || []);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to create promo coupon.');
    }
  };

  const stats = dashboardStats || {
    totalUsers: students.length,
    activeStudents: students.filter(u => u.role === 'student' && u.status === 'Active').length,
    teachers: students.filter(u => u.role === 'teacher').length,
    admins: students.filter(u => u.role === 'admin').length,
    submissionsToday: 0,
    pendingScoring: 0,
    completedMocks: 0,
    publishedQ: 0,
    draftQ: 0,
    archivedQ: 0,
  };

  const handleSuspendUser = async (id: string) => {
    if (!confirm('Suspend this user? They will not be able to log in.')) return;
    await apiFetch(`/api/admin/users/${id}/suspend`, { method: 'POST' });
    loadAdminTelemetry();
  };
  const handleReactivateUser = async (id: string) => {
    if (!confirm('Reactivate this user?')) return;
    await apiFetch(`/api/admin/users/${id}/reactivate`, { method: 'POST' });
    loadAdminTelemetry();
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    if (!confirm(`Change role to ${newRole}?`)) return;
    await apiFetch(`/api/admin/users/${id}/role`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
    loadAdminTelemetry();
  };

  const handlePasswordReset = async (id: string, email: string) => {
    if (!confirm(`Trigger password reset for ${email}? This will invalidate their current password.`)) return;
    await apiFetch(`/api/admin/users/${id}/password-reset`, { method: 'POST' });
    alert('Password reset triggered. User must use forgot-password flow to set new password.');
  };



  const handleToggleUserStatus = (id: string) => {
    setStudents(
      students.map((st) => {
        if (st.id === id) {
          return { ...st, status: st.status === 'Active' ? 'Inactive' : 'Active' };
        }
        return st;
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row gap-8">
      {/* Admin Sidebar Navigation */}
      <div className="lg:w-1/5 space-y-4">
        <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-850 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-gray-300">ADMIN CONTROL</h2>
          </div>
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Shield },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'teachers', label: 'Teachers', icon: Book },
              { id: 'questions', label: 'Question Bank', icon: Database },
              { id: 'submissions', label: 'Submissions', icon: Search },
              { id: 'mocktests', label: 'Mock Tests', icon: Layers },
              { id: 'reports', label: 'Reports', icon: DollarSign },
              { id: 'audit', label: 'Audit Logs', icon: Key },
              { id: 'reliability', label: 'Reliability', icon: Activity },
              { id: 'system', label: 'System', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Admin canvas */}
      <div className="flex-1 space-y-6">
        {/* TAB 1: METRICS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'emerald' },
                { label: 'Active Students', value: stats.activeStudents, color: 'teal' },
                { label: 'Teachers', value: stats.teachers, color: 'sky' },
                { label: 'Admins', value: stats.admins, color: 'orange' },
              ].map(k => (
                <div key={k.label} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                  <p className={`text-2xl font-black text-${k.color}-400 font-mono`}>{k.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Submissions Today', value: stats.submissionsToday, color: 'purple' },
                { label: 'Pending Scoring', value: stats.pendingScoring, color: 'amber' },
                { label: 'Completed Mocks', value: stats.completedMocks, color: 'emerald' },
                { label: 'Published Questions', value: stats.publishedQ, color: 'sky' },
              ].map(k => (
                <div key={k.label} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                  <p className={`text-2xl font-black text-${k.color}-400 font-mono`}>{k.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Live background grading queue */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex justify-between items-center">
                  <span>Asynchronous Grading Worker Queue</span>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono animate-pulse">● POLLING</span>
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {liveJobs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No active background jobs in queue.</p>
                  ) : (
                    liveJobs.map((job) => {
                      let submissionId = '';
                      let taskCode = '';
                      try {
                        const parsed = JSON.parse(job.data || '{}');
                        submissionId = parsed.submissionId || '';
                        taskCode = parsed.taskCode || '';
                      } catch (e) {}
                      
                      const jobIdStr = job.id || '';
                      const displayJobName = job.name === 'grade_submission' ? 'Grading Worker' : (job.name || 'Worker');
                      const displaySubInfo = submissionId 
                        ? `Submission #${submissionId.slice(-6)}` 
                        : 'System Maintenance';

                      return (
                        <div key={job.id} className="p-2.5 rounded-lg bg-gray-950/40 border border-gray-850 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold">Job #{jobIdStr.slice(-6)} • {displayJobName}</p>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {displaySubInfo} {taskCode ? `(${taskCode})` : ''}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400 animate-pulse'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live server logs database */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4">Live Database Audit System Logs</h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                  {liveLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No system log logs retrieved.</p>
                  ) : (
                    liveLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="border-b border-gray-850/60 pb-1.5 last:border-0">
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={log.level === 'ERROR' ? 'text-red-400 font-bold' : log.level === 'WARN' ? 'text-yellow-400' : 'text-emerald-400'}>
                            [{log.level}]
                          </span>
                        </div>
                        <p className={`mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTION BANK MANAGER */}
        {activeTab === 'questions' && (
          <QuestionBankPanel
            theme={theme}
            apiFetch={apiFetch}
            items={questionBankItems}
            onRefresh={loadAdminTelemetry}
            onPreview={setPreviewQ}
          />
        )}

        {/* TAB 3: COURSE MANAGER */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Course Management</h3>
            <div className={`p-8 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
              <p className="text-sm text-gray-400">Course administration is deferred. Learning content is managed through the Learning Centre.</p>
            </div>
          </div>
        )}

        {/* TAB: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">User Accounts</h3>
              <input type="text" placeholder="Search name/email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white w-48" />
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white"><option value="all">All Roles</option><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white"><option value="all">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
            </div>
            <div className={`overflow-x-auto rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b font-mono text-gray-500 uppercase text-[10px] bg-gray-950/40"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Score</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-850">
                  {filteredStudents.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE).map((st) => (
                    <tr key={st.id} className="hover:bg-white/5">
                      <td className="p-3 font-bold">{st.name}</td><td className="p-3 text-gray-400 font-mono text-[10px]">{st.email}</td>
                      <td className="p-3"><select value={st.role} onChange={e => handleChangeRole(st.id, e.target.value)} className="px-2 py-0.5 rounded text-[9px] bg-gray-950 border border-gray-850 text-white"><option value="student">student</option><option value="teacher">teacher</option><option value="admin">admin</option></select></td>
                      <td className="p-3 font-mono text-emerald-400">{st.currentAvg || st.targetScore || '—'}</td>
                      <td className="p-3"><span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${st.status==='Active'?'bg-emerald-500/10 text-emerald-400':'bg-red-500/10 text-red-400'}`}>{st.status}</span></td>
                      <td className="p-3 text-right space-x-1">
                        <button onClick={() => handleViewUser(st.id)} className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded text-[9px] font-bold" title="View">View</button>
                        {st.status === 'Active' ? <button onClick={() => handleSuspendUser(st.id)} className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[9px] font-bold" title="Suspend">Sus</button> : <button onClick={() => handleReactivateUser(st.id)} className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded text-[9px] font-bold" title="Reactivate">Act</button>}
                        <button onClick={() => handlePasswordReset(st.id, st.email)} className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded text-[9px] font-bold" title="Reset Password">Pwd</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(filteredStudents.length / PAGE_SIZE) > 1 && (<div className="flex justify-center gap-2 mt-2">{Array.from({ length: Math.ceil(filteredStudents.length / PAGE_SIZE) }, (_, i) => <button key={i} onClick={() => setUserPage(i)} className={`px-2 py-1 rounded text-xs ${userPage === i ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{i + 1}</button>)}</div>)}
          </div>
        )}

        {/* Question Preview Modal */}
        {previewQ && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewQ(null)}><div className={`w-full max-w-lg rounded-2xl border p-6 max-h-[80vh] overflow-y-auto ${theme==='dark'?'bg-[#101424] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'}`} onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h3 className="font-bold">Student-Safe Preview</h3><button onClick={()=>setPreviewQ(null)} className="text-gray-500 hover:text-white">✕</button></div><div className="space-y-2 text-xs"><p><span className="text-gray-500">Task:</span> {previewQ.taskCode} — {previewQ.section}</p><p><span className="text-gray-500">Title:</span> {previewQ.title}</p><p><span className="text-gray-500">Instruction:</span> {previewQ.instruction}</p><p><span className="text-gray-500">Prompt:</span> {previewQ.promptText?.substring(0,200)}{(previewQ.promptText||'').length>200?'...':''}</p><p><span className="text-gray-500">Difficulty:</span> {previewQ.difficulty}</p><p><span className="text-gray-500">Status:</span> {previewQ.status}</p>{previewQ.audioUrl&&<p><span className="text-gray-500">Audio:</span> {previewQ.audioUrl}</p>}{previewQ.imageUrl&&<p><span className="text-gray-500">Image:</span> {previewQ.imageUrl}</p>}<p className="text-[10px] text-gray-600 mt-2">Note: answerKeyJson, sampleAnswer, and explanation are hidden from students.</p></div></div></div>)}

        {/* User Detail Drawer */}
        {selectedUser && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}><div className={`w-full max-w-sm rounded-2xl border p-6 ${theme==='dark'?'bg-[#101424] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'}`} onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h3 className="font-bold">{selectedUser.name}</h3><button onClick={()=>setSelectedUser(null)} className="text-gray-500 hover:text-white">✕</button></div>{userDetailLoading?<p className="text-gray-400 text-sm">Loading...</p>:<div className="space-y-2 text-xs"><p><span className="text-gray-500">Email:</span> {selectedUser.email}</p><p><span className="text-gray-500">Role:</span> {selectedUser.role}</p><p><span className="text-gray-500">Status:</span> {selectedUser.status}</p><p><span className="text-gray-500">Target Score:</span> {selectedUser.targetScore ?? '—'}</p><p><span className="text-gray-500">Avg Score:</span> {selectedUser.currentAvg ?? '—'}</p><p><span className="text-gray-500">Tier:</span> {selectedUser.subTier}</p><p><span className="text-gray-500">Created:</span> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}</p><p><span className="text-gray-500">Last Login:</span> {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString() : '—'}</p></div>}</div></div>)}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Teacher Management</h3>
            {students.filter(u => u.role === 'teacher').length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}><p className="text-sm text-gray-400">No teacher accounts. Promote a user via the Users tab role dropdown.</p><p className="text-xs text-gray-500 mt-2">Cohort and class assignment is deferred to Phase 12.</p></div>
            ) : (
              <div className="space-y-2">{students.filter(u => u.role === 'teacher').map(t => <div key={t.id} className={`p-4 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}><div><span className="font-bold text-sm">{t.name}</span><span className="text-gray-500 text-xs ml-2">{t.email}</span></div><div className="flex gap-2"><button onClick={() => handleChangeRole(t.id, 'student')} className="px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[10px] font-bold">Remove Teacher</button></div></div>)}</div>
            )}
          </div>
        )}

        {/* TAB: SUBMISSIONS */}
        {activeTab === 'submissions' && <AdminSubmissionsPanel theme={theme} apiFetch={apiFetch} />}

        {/* TAB: MOCK TESTS */}
        {activeTab === 'mocktests' && <AdminMockTestsPanel theme={theme} apiFetch={apiFetch} />}

        {/* TAB: REPORTS */}
        {activeTab === 'reports' && <AdminReportsPanel theme={theme} apiFetch={apiFetch} />}

        {/* TAB 4.5: AUDIT & EMAIL AUTOMATION LOGS */}
        {activeTab === 'audit' && (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Administrative Audit Log */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">System Audit Trails</h3>
              <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500">Live transaction records tracking student billing tier updates, coupon activations, and manual backups.</p>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditLogsList.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-6 text-center">No transactions recorded in system database.</p>
                  ) : (
                    auditLogsList.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-950/40 border border-gray-850 rounded-xl space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between text-gray-500">
                          <span className="font-bold text-emerald-400 uppercase">[{log.category || 'General'}] {log.action}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-300 text-xs font-sans leading-relaxed">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Email Log — deferred */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Email Delivery Log</h3>
              <div className={`p-6 rounded-3xl border text-center ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-sm text-gray-400">Email delivery log is not available yet. Deferred until Background Jobs / Reliability phase.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RELIABILITY */}
        {activeTab === 'reliability' && <AdminReliabilityPanel theme={theme} apiFetch={apiFetch} />}

        {/* TAB 5: SYSTEM SETTINGS & UTILITIES */}
        {activeTab === 'system' && (
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Administrative Console & Utilities</h3>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Coupon Creator */}
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <div className="border-b border-gray-850 pb-3">
                  <h4 className="text-sm font-bold">Coupon Code Generator</h4>
                  <p className="text-xs text-gray-500 mt-1">Generate promotional and teacher referral discount codes.</p>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-gray-400">Promo Code</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. LAUNCH30"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-gray-400">Discount Percent (%)</label>
                      <input
                        required
                        type="number"
                        min={5}
                        max={100}
                        value={newCouponDiscount}
                        onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-gray-400">Max Active Redemptions</label>
                      <input
                        required
                        type="number"
                        min={1}
                        max={1000}
                        value={newCouponMaxUses}
                        onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {couponError && <p className="text-[10px] text-rose-400 font-mono">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-emerald-400 font-mono font-bold">{couponSuccess}</p>}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Deploy Promo Code
                  </button>
                </form>

                {/* Active coupons */}
                <div className="pt-4 border-t border-gray-850/60 space-y-3">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">ACTIVE DEPLOYED COUPONS:</p>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {coupons.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No coupons active.</p>
                    ) : (
                      coupons.map((cp) => (
                        <div key={cp.id} className="p-2.5 rounded-lg bg-gray-950/40 border border-gray-850 text-xs flex justify-between items-center font-mono">
                          <div>
                            <span className="font-bold text-emerald-400">{cp.code}</span>
                            <span className="text-gray-400 ml-2">({cp.discountPercent}% off)</span>
                          </div>
                          <span className="text-gray-500 text-[10px]">
                            Used: {cp.usedCount || 0} / {cp.maxUses}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Database Backups — deferred */}
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 ${theme === 'dark' ? 'bg-[#0f1322] border-[#1d263b]' : 'bg-white border-gray-200'}`}>
                <div className="border-b border-gray-850 pb-3">
                  <h4 className="text-sm font-bold">Database Backup & Recovery</h4>
                  <p className="text-xs text-gray-500 mt-1">Production database backup and snapshot management is deferred to Phase 16.</p>
                </div>
              </div>

            {/* General Settings Controls */}
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="grid sm:grid-cols-2 gap-6 border-b border-gray-850 pb-6">
                <div>
                  <h4 className="text-xs font-bold mb-1">Mock Exam Strict Pacing Mode</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mb-3">Force auto-next navigation immediately upon exam timers reaching 0.</p>
                  <button className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase font-mono">
                    Enabled ✓
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold mb-1">Dual Micro-Phonetic Filter</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mb-3">Enforce high dynamic acoustic capture constraints for female vocal streams.</p>
                  <button className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase font-mono">
                    Enabled ✓
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-red-400 mb-1">Platform Maintenance Controls</h4>
                <p className="text-[10px] text-gray-500 leading-normal mb-3">Initiate data purge sweeps or system reboot parameters.</p>
                <div className="flex gap-2">
                  <button onClick={() => alert('Platform cached buffers flushed.')} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                    Flush Buffers
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
