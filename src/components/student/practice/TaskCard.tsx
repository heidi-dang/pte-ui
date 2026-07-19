import { Play, List } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import type { PTETaskCode, PTESection } from '../../../types';

const sectionBadge: Record<string, 'premium' | 'info' | 'success' | 'warning'> = {
  Speaking: 'premium',
  Writing: 'info',
  Reading: 'success',
  Listening: 'warning',
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TaskCardProps {
  code: PTETaskCode;
  name: string;
  section: PTESection;
  questionCount: number;
  averageScore: number | null;
  lastAttemptedAt: string | null;
  onQuickStart: () => void;
  onChooseQuestions: () => void;
  key?: string | number;
}

export function TaskCard({
  code,
  name,
  section,
  questionCount,
  averageScore,
  lastAttemptedAt,
  onQuickStart,
  onChooseQuestions,
}: TaskCardProps) {
  const scoreColor = averageScore === null ? 'text-gray-500' : averageScore >= 70 ? 'text-success-400' : averageScore >= 40 ? 'text-warning-400' : 'text-error-400';

  return (
    <div className="group rounded-2xl border border-dark-border bg-dark-surface p-5 transition-all duration-200 hover:border-primary-500/30 hover:bg-dark-surface-100 hover:shadow-lg hover:shadow-primary-500/5">
      <div className="mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium text-gray-500 uppercase tracking-wider">{code}</span>
            <Badge variant={sectionBadge[section] || 'default'}>{section}</Badge>
          </div>
          <h3 className="text-sm font-semibold text-gray-100 leading-snug truncate">{name}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <span className="font-medium text-gray-300">{questionCount}</span>
          questions
        </span>
        {averageScore !== null && (
          <span className="flex items-center gap-1">
            <span className={`font-medium ${scoreColor}`}>{Math.round(averageScore)}%</span>
            avg score
          </span>
        )}
        {lastAttemptedAt && (
          <span className="hidden sm:inline-flex items-center gap-1">
            Last: <span className="text-gray-400">{formatDate(lastAttemptedAt)}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onQuickStart} icon={<Play className="h-3.5 w-3.5 fill-current" />}>
          Quick Start
        </Button>
        <Button size="sm" variant="secondary" onClick={onChooseQuestions} icon={<List className="h-3.5 w-3.5" />}>
          Choose Questions
        </Button>
      </div>
    </div>
  );
}
