import React, { useState, useEffect, useRef } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PRACTICE_ITEMS_LIST, PTE_TASK_TYPES, PRACTICE_ITEMS } from '../data/mockData';
import { PTETaskCode, PracticeItem } from '../types';
import { getPublishedQuestions } from '../api/questions.api';
import { BookOpen, BarChart, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSubmissionHistory } from '../practice/hooks/useSubmissionHistory';
import { PracticeTaskForm } from '../practice/components/PracticeTaskForm';
import { PracticeResultPanel } from '../practice/components/PracticeResultPanel';
import { PracticeSidePanels } from '../practice/components/PracticeSidePanels';

const ONE_PLAY_TASKS = new Set<PTETaskCode>(['RS', 'RL', 'ASQ', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);

interface PracticeEngineProps { initialTaskCode?: PTETaskCode; }

export const PracticeEngine: React.FC<PracticeEngineProps> = ({ initialTaskCode = 'RA' }) => {
  const { theme } = useGlobalContext();
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeCode, setActiveCode] = useState<PTETaskCode>(initialTaskCode);
  const [idx, setIdx] = useState(0);
  const [timer, setTimer] = useState(40);
  const [prepTimer, setPrepTimer] = useState(10);
  const [status, setStatus] = useState<'preparing' | 'recording' | 'answering' | 'completed'>('preparing');
  const [input, setInput] = useState({ typedText: '', option: '', multiple: [] as string[], blanks: {} as Record<number, string>, incorrect: [] as string[] });
  const [reordered, setReordered] = useState<string[]>([]);
  const [recordingUI, setRecordingUI] = useState({ realMic: false, levels: [] as number[], url: null as string | null, playback: false });
  const [audioUI, setAudioUI] = useState({ playing: false, progress: 0, played: false });
  const [result, setResult] = useState({ show: false, grading: false, error: '', submission: null as any });
  const [searchQ, setSearchQ] = useState('');
  const [cms, setCms] = useState({ items: [] as any[], source: 'fallback' as 'cms' | 'fallback' });
  const [bookmarks, setBookmarks] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('bookmarkedQuestions') || '[]'); } catch { return []; } });

  const mockItems = PRACTICE_ITEMS_LIST.filter(i => i.code === activeCode);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const noteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { serverSubmissions, questionHistory, loadServerSubmissions, loadLocalHistory, saveLocalAttempt } = useSubmissionHistory();

  const cmsPractice: PracticeItem[] = cms.items.map((q: any) => ({
    id: q.id, code: q.taskCode as PTETaskCode, title: q.title, instruction: q.instruction,
    promptText: q.promptText, imageUrl: q.imageUrl || undefined, audioUrl: q.audioUrl || undefined,
    options: (Array.isArray(q.optionsJson) ? q.optionsJson : typeof q.optionsJson === 'string' ? (() => { try { const p = JSON.parse(q.optionsJson); return Array.isArray(p) ? p : []; } catch { return []; } })() : []),
    modelAnswer: q.sampleAnswer || '', tips: [], vocabulary: (Array.isArray(q.tagsJson) ? q.tagsJson : typeof q.tagsJson === 'string' ? (() => { try { const p = JSON.parse(q.tagsJson); return Array.isArray(p) ? p.filter((t): t is string => typeof t === 'string').map((t: string) => ({ phrase: t, meaning: '' })) : []; } catch { return []; } })() : []), templates: [],
  }));
  const hasCms = cms.source === 'cms' && cmsPractice.length > 0;
  const codeItems = hasCms ? cmsPractice : mockItems;
  const activeItem: PracticeItem = codeItems[idx] || codeItems[0] || PRACTICE_ITEMS[activeCode] || PRACTICE_ITEMS['RA'];
  const cmsId = hasCms && activeItem.id?.length > 20 ? activeItem.id : null;
  const isBookmarked = bookmarks.includes(activeItem.id);
  const filtered = codeItems.filter(i => { const q = searchQ.toLowerCase(); return i.title.toLowerCase().includes(q) || i.instruction.toLowerCase().includes(q); });

  const toggleBookmark = () => {
    const updated = bookmarks.includes(activeItem.id) ? bookmarks.filter(id => id !== activeItem.id) : [...bookmarks, activeItem.id];
    setBookmarks(updated);
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(updated));
  };

  useEffect(() => { let cancel = false; setCms(prev => ({ ...prev, items: [], source: 'fallback' })); (async () => { try { const items = await getPublishedQuestions({ taskCode: activeCode, limit: 10 }); if (!cancel) setCms({ items: items || [], source: items?.length > 0 ? 'cms' : 'fallback' }); } catch { if (!cancel) setCms({ items: [], source: 'fallback' }); } })(); return () => { cancel = true; }; }, [activeCode]);
  useEffect(() => { loadServerSubmissions(); }, [activeCode]);
  useEffect(() => { setIdx(0); const info = PTE_TASK_TYPES.find(t => t.code === activeCode)!; setPrepTimer(info.prepTime); setTimer(info.attemptTime); }, [activeCode]);
  useEffect(() => { if (status !== 'preparing') return; const interval = setInterval(() => setPrepTimer(prev => prev <= 1 ? (clearInterval(interval), 0) : prev - 1), 1000); return () => clearInterval(interval); }, [status]);
  useEffect(() => { if (prepTimer <= 0 && status === 'preparing') setStatus(['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(activeCode) ? 'recording' : 'answering'); }, [prepTimer, status, activeCode]);
  useEffect(() => { if (status !== 'recording' && status !== 'answering') return; const interval = setInterval(() => setTimer(prev => prev <= 1 ? (setStatus('completed'), clearInterval(interval), 0) : prev - 1), 1000); return () => clearInterval(interval); }, [status]);
  useEffect(() => { if (status !== 'recording') return; setRecordingUI(prev => ({ ...prev, realMic: true })); simIntervalRef.current = setInterval(() => setRecordingUI(prev => ({ ...prev, levels: Array.from({ length: 18 }, () => Math.floor(Math.random() * 40) + 10) })), 150); return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); }; }, [status]);
  useEffect(() => {
    const draft = localStorage.getItem(`practice_draft_${activeItem.id}`);
    setInput({ typedText: draft || '', option: '', multiple: [], blanks: {}, incorrect: [] });
    setRecordingUI({ realMic: false, levels: [], url: null, playback: false });
    if (activeItem.code === 'ROP' && activeItem.options) setReordered([...activeItem.options]); else setReordered([]);
    setResult({ show: false, grading: false, error: '', submission: null });
    setAudioUI({ playing: false, progress: 0, played: false });
    setPrepTimer(PTE_TASK_TYPES.find(t => t.code === activeItem.code)?.prepTime || 10);
    setTimer(PTE_TASK_TYPES.find(t => t.code === activeItem.code)?.attemptTime || 40);
    setStatus('preparing');
    loadLocalHistory(activeItem.id);
  }, [activeItem.id]);
  useEffect(() => { if (input.typedText && ['SWT', 'WE', 'SST', 'WFD'].includes(activeCode)) localStorage.setItem(`practice_draft_${activeItem.id}`, input.typedText); }, [input.typedText, activeItem.id, activeCode]);

  useEffect(() => { const saved = localStorage.getItem(`practice_note_${activeItem.id}`) || ''; setNoteText(saved); }, [activeItem.id]);
  const handleNoteChange = (text: string) => { setNoteText(text); localStorage.setItem(`practice_note_${activeItem.id}`, text); setNoteSaving(true); if (noteTimerRef.current) clearTimeout(noteTimerRef.current); noteTimerRef.current = setTimeout(() => setNoteSaving(false), 500); };

  const handlePlayAudio = () => {
    if (ONE_PLAY_TASKS.has(activeCode) && audioUI.played) return;
    const audio = promptAudioRef.current || (activeItem.audioUrl ? (promptAudioRef.current = new Audio(activeItem.audioUrl)) : null);
    if (!audio) return;
    if (!promptAudioRef.current) { audio.addEventListener('timeupdate', () => setAudioUI(prev => ({ ...prev, progress: (audio.currentTime / (audio.duration || 1)) * 100 }))); audio.addEventListener('ended', () => setAudioUI({ playing: false, progress: 100, played: true })); }
    audio.currentTime = 0; audio.play().catch(() => {}); setAudioUI(prev => ({ ...prev, playing: true, played: true }));
  };

  const handleSubmit = async () => {
    setResult(prev => ({ ...prev, grading: true, error: '' }));
    try {
      const res = await (await import('../api/student.api')).submitPracticeResponse({
        taskCode: activeCode, title: activeItem.title, section: PTE_TASK_TYPES.find(t => t.code === activeCode)?.section || 'Speaking',
        answerText: input.typedText || null, audioUrl: recordingUI.url || null, questionBankItemId: cmsId || undefined,
        answerJson: JSON.stringify({ typedText: input.typedText || null, selectedOption: input.option || null, selectedMultiple: input.multiple.length > 0 ? input.multiple : null, reorderedList: reordered.length > 0 ? reordered : null, blanks: Object.keys(input.blanks).length > 0 ? input.blanks : null, highlightedIncorrect: input.incorrect.length > 0 ? input.incorrect : null }),
      });
      saveLocalAttempt(activeItem.id, 0, input.typedText || '(selection)');
      setResult(prev => ({ ...prev, submission: { ...res, _polling: true } }));
    } catch (err: any) { setResult(prev => ({ ...prev, error: err.message || 'Submission failed', grading: false })); return; }
    localStorage.removeItem(`practice_draft_${activeItem.id}`);
    setTimeout(() => setResult(prev => ({ ...prev, grading: false, show: true })), 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {recordingUI.url && <audio ref={recordedAudioRef} src={recordingUI.url} className="hidden" onEnded={() => setRecordingUI(prev => ({ ...prev, playback: false }))} />}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4 space-y-4">
          <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-400" /> All 22 Task Types</h3>
            <div className="space-y-1 max-h-96 lg:max-h-[550px] overflow-y-auto pr-2">
              {PTE_TASK_TYPES.map(t => (
                <button key={t.code} onClick={() => setActiveCode(t.code)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${activeCode === t.code ? 'bg-emerald-500 text-white font-bold shadow' : theme === 'dark' ? 'hover:bg-gray-950 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${activeCode === t.code ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.code}</span>
                    <span className="truncate max-w-[130px]">{t.name}</span>
                  </div>
                  <span className="text-[9px] opacity-60 uppercase font-mono">{t.section[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6">
          {serverSubmissions.length > 0 && (
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <BarChart className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Your Analytics</span>
                <span className="text-xs font-bold text-emerald-400">{serverSubmissions.length} scored</span>
                <span className="text-xs text-gray-500">Avg: <span className="text-white font-bold">{Math.round(serverSubmissions.reduce((a: number, s: any) => a + (s.score || 0), 0) / serverSubmissions.length)}/90</span></span>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {!result.show ? (
              <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`p-6 sm:p-8 rounded-3xl border relative ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
                <PracticeTaskForm activeCode={activeCode} status={status} theme={theme} activeItem={activeItem}
                  prepTimer={prepTimer} timer={timer}
                  userTypedText={input.typedText} onUserTypedTextChange={v => setInput(prev => ({ ...prev, typedText: v }))}
                  userSelectedOption={input.option} onUserSelectedOptionChange={v => setInput(prev => ({ ...prev, option: v }))}
                  userSelectedMultiple={input.multiple} onToggleMultiple={opt => setInput(prev => ({ ...prev, multiple: prev.multiple.includes(opt) ? prev.multiple.filter(o => o !== opt) : [...prev.multiple, opt] }))}
                  reorderedList={reordered} onMoveItem={(i, dir) => { const nl = [...reordered]; const ti = dir === 'up' ? i - 1 : i + 1; if (ti >= 0 && ti < nl.length) { [nl[i], nl[ti]] = [nl[ti], nl[i]]; setReordered(nl); } }}
                  selectedBlanks={input.blanks} onSelectedBlanksChange={v => setInput(prev => ({ ...prev, blanks: v }))}
                  highlightedIncorrect={input.incorrect} onHighlightedIncorrectChange={v => setInput(prev => ({ ...prev, incorrect: v }))}
                  isRecordingRealMic={recordingUI.realMic} simulatedVoiceLevels={recordingUI.levels}
                  isAudioPlaying={audioUI.playing} audioPlayed={audioUI.played} audioPlaybackProgress={audioUI.progress}
                  onPlayAudio={handlePlayAudio} promptAudioRef={promptAudioRef}
                  filteredCodeItems={filtered} codeItems={codeItems} bookmarkedQuestions={bookmarks}
                  qSearchQuery={searchQ} onQSearchQueryChange={setSearchQ}
                  onSelectQuestion={item => setIdx(codeItems.indexOf(item))}
                  isBookmarked={isBookmarked} onToggleBookmark={toggleBookmark} />
                <div className="flex justify-between items-center border-t border-gray-850 pt-6">
                  <div className="flex gap-2">
                    <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (i > 0) setActiveCode(PTE_TASK_TYPES[i - 1].code); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Prev
                    </button>
                    <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (i < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[i + 1].code); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                      Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <button onClick={handleSubmit} disabled={result.grading}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer">
                    {result.grading ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit</>}
                  </button>
                  {result.error && <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4" /><span>{result.error}</span></div>}
                </div>
              </motion.div>
            ) : (
              <PracticeResultPanel scoredSubmission={result.submission} theme={theme} activeItem={activeItem}
                onRetry={() => setResult({ show: false, grading: false, error: '', submission: null })}
                onAdvance={() => { if (idx < codeItems.length - 1) { setIdx(idx + 1); setResult(prev => ({ ...prev, show: false })); } else { const ni = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (ni < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[ni + 1].code); else setResult(prev => ({ ...prev, show: false })); } }} />
            )}
          </AnimatePresence>
          <PracticeSidePanels theme={theme} note={noteText} isNoteSaving={noteSaving} onNoteChange={handleNoteChange}
            serverSubmissions={serverSubmissions} questionHistory={questionHistory} itemId={activeItem.id} />
        </div>
      </div>
    </div>
  );
};
