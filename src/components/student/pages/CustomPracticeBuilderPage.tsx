import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Play, Check, Plus, Minus, Sparkles } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProgressBar } from '../../ui/ProgressBar';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { CardSkeleton } from '../../ui/Skeleton';
import { useStudentRoute } from '../StudentRouteContext';
import { getAllContracts } from '../../../practice/contracts/registry';
import type { PTETaskCode } from '../../../types';

type Step = 'select-tasks' | 'configure' | 'preview';

const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'] as const;
const DEFAULT_COUNT = 3;

const sectionColors: Record<string, string> = {
  Speaking: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Writing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Reading: 'bg-green-500/10 text-green-400 border-green-500/20',
  Listening: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export function CustomPracticeBuilderPage() {
  const { navigate } = useStudentRoute();
  const [step, setStep] = useState<Step>('select-tasks');
  const [selectedTasks, setSelectedTasks] = useState<Set<PTETaskCode>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [difficulty, setDifficulty] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);

  const contracts = useMemo(() => getAllContracts(), []);

  const groupedContracts = useMemo(() => {
    const groups: Record<string, typeof contracts> = {};
    for (const c of contracts) {
      if (!groups[c.section]) groups[c.section] = [];
      groups[c.section].push(c);
    }
    return groups;
  }, [contracts]);

  const totalQuestions = useMemo(() => {
    return Array.from(selectedTasks).reduce((sum, code) => sum + (counts[code] || DEFAULT_COUNT), 0);
  }, [selectedTasks, counts]);

  const toggleTask = useCallback((code: PTETaskCode) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
        setCounts((c) => ({ ...c, [code]: c[code] || DEFAULT_COUNT }));
      }
      return next;
    });
  }, []);

  const updateCount = useCallback((code: PTETaskCode, delta: number) => {
    setCounts((prev) => {
      const current = prev[code] || DEFAULT_COUNT;
      const next = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [code]: next };
    });
  }, []);

  const handleStart = useCallback(() => {
    if (selectedTasks.size === 0) {
      setError('Please select at least one task type');
      return;
    }
    navigate('practice-session');
  }, [selectedTasks, navigate]);

  const handleNext = useCallback(() => {
    if (selectedTasks.size === 0) {
      setError('Please select at least one task type to continue');
      return;
    }
    setError(null);
    setStep('configure');
  }, [selectedTasks]);

  const handleBack = useCallback(() => {
    setError(null);
    if (step === 'configure') setStep('select-tasks');
    else if (step === 'preview') setStep('configure');
  }, [step]);

  const stepProgress = step === 'select-tasks' ? 33 : step === 'configure' ? 66 : 100;

  const sectionOrder = ['Speaking', 'Writing', 'Reading', 'Listening'];

  return (
    <StudentPageContainer
      title="Custom Practice Builder"
      subtitle="Build your perfect practice session"
      maxWidth="lg"
    >
      <div className="space-y-8">
        <ProgressBar value={stepProgress} size="sm" variant="default" className="mb-2" />

        {step === 'select-tasks' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-100 mb-1">Select Task Types</h2>
              <p className="text-sm text-gray-500">Choose one or more PTE task types to practice</p>
            </div>

            {error && (
              <div className="rounded-lg bg-error-500/10 border border-error-500/20 px-4 py-2.5 text-sm text-error-400">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {sectionOrder.map((section) => {
                const tasks = groupedContracts[section];
                if (!tasks || tasks.length === 0) return null;
                return (
                  <div key={section}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${sectionColors[section]}`}>
                        {section}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tasks.filter((t) => selectedTasks.has(t.code)).length}/{tasks.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tasks.map((c) => {
                        const isSelected = selectedTasks.has(c.code);
                        return (
                          <button
                            key={c.code}
                            onClick={() => toggleTask(c.code)}
                            className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                              isSelected
                                ? 'border-primary-500/40 bg-primary-500/5'
                                : 'border-dark-border bg-dark-surface hover:border-dark-elevated hover:bg-dark-surface-100'
                            }`}
                          >
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                              isSelected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-gray-600'
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-medium text-gray-500">{c.code}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-200">{c.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dark-border">
              <div className="text-sm text-gray-500">
                {selectedTasks.size > 0 ? (
                  <span><span className="font-semibold text-gray-300">{selectedTasks.size}</span> task type{selectedTasks.size !== 1 ? 's' : ''} selected</span>
                ) : (
                  <span>No task types selected</span>
                )}
              </div>
              <Button onClick={handleNext} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                Next — Configure
              </Button>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-100 mb-1">Configure Questions</h2>
              <p className="text-sm text-gray-500">Set the number and difficulty of questions per task type</p>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-dark-border bg-dark-surface-50">
              <label className="text-sm font-medium text-gray-300">Difficulty:</label>
              <div className="flex gap-1.5">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      difficulty === d
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {Array.from(selectedTasks).map((code) => {
                const contract = contracts.find((c) => c.code === code);
                if (!contract) return null;
                return (
                  <div
                    key={code}
                    className="flex items-center justify-between rounded-xl border border-dark-border bg-dark-surface p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono font-medium text-gray-500">{code}</span>
                        <Badge variant={code === 'RA' ? 'premium' : 'default'}>{contract.section}</Badge>
                      </div>
                      <span className="text-sm font-medium text-gray-200">{contract.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => updateCount(code, -1)}
                        disabled={(counts[code] || DEFAULT_COUNT) <= 1}
                        className="h-8 w-8 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-100 tabular-nums">
                        {counts[code] || DEFAULT_COUNT}
                      </span>
                      <button
                        onClick={() => updateCount(code, 1)}
                        disabled={(counts[code] || DEFAULT_COUNT) >= 20}
                        className="h-8 w-8 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dark-border">
              <Button variant="ghost" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-300">{totalQuestions}</span> question{totalQuestions !== 1 ? 's' : ''} total
                </span>
                <Button
                  onClick={() => setStep('preview')}
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Next — Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-100 mb-1">Preview & Start</h2>
              <p className="text-sm text-gray-500">Review your custom practice session before starting</p>
            </div>

            <div className="rounded-2xl border border-dark-border bg-dark-surface p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                <h3 className="text-sm font-semibold text-gray-100">Session Summary</h3>
                <Badge variant="premium">{difficulty === 'All' ? 'Mixed' : difficulty} Difficulty</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-dark-surface-50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary-400">{selectedTasks.size}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Task Types</div>
                </div>
                <div className="rounded-xl bg-dark-surface-50 p-3 text-center">
                  <div className="text-2xl font-bold text-gray-100">{totalQuestions}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Questions</div>
                </div>
                <div className="rounded-xl bg-dark-surface-50 p-3 text-center">
                  <div className="text-2xl font-bold text-success-400">~{totalQuestions * 2}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Est. Minutes</div>
                </div>
                <div className="rounded-xl bg-dark-surface-50 p-3 text-center">
                  <div className="text-2xl font-bold text-warning-400">{difficulty === 'All' ? 'Mixed' : difficulty}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Difficulty</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Selected Task Types</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedTasks).map((code) => {
                    const contract = contracts.find((c) => c.code === code);
                    return (
                      <div key={code} className="flex items-center gap-1.5 rounded-full bg-dark-elevated border border-dark-border px-3 py-1">
                        <span className="text-[11px] font-mono font-medium text-gray-400">{code}</span>
                        <span className="text-xs text-gray-300">{contract?.name}</span>
                        <span className="text-xs text-gray-500 ml-1">×{counts[code] || DEFAULT_COUNT}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-error-500/10 border border-error-500/20 px-4 py-2.5 text-sm text-error-400">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dark-border">
              <Button variant="ghost" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleStart}
                icon={<Sparkles className="h-4 w-4" />}
              >
                Start Practice Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </StudentPageContainer>
  );
}
