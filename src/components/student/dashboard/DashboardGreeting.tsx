import type { DashboardGreeting } from '../../../shared/api/dashboard';

interface DashboardGreetingProps {
  data?: DashboardGreeting;
}

export function DashboardGreeting({ data }: DashboardGreetingProps) {
  if (!data) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-100">
          Welcome back, {data.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {data.lastActive
            ? `Last active ${new Date(data.lastActive).toLocaleDateString()}`
            : 'Let\'s get started with your practice'}
        </p>
      </div>
      {data.streakDays != null && data.streakDays > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-dark-elevated border border-dark-border px-4 py-2 shrink-0">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-semibold text-gray-100">{data.streakDays} day streak</p>
            <p className="text-xs text-gray-500">Keep it going!</p>
          </div>
        </div>
      )}
    </div>
  );
}
