import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Button } from '../../ui/Button';
import { getDashboardData } from '../../../api/dashboard.api';
import type { DashboardData } from '../../../shared/api/dashboard';

import { DashboardGreeting } from '../dashboard/DashboardGreeting';
import { TargetScoreCard } from '../dashboard/TargetScoreCard';
import { ExamDateCard } from '../dashboard/ExamDateCard';
import { ContinueActivityCard } from '../dashboard/ContinueActivityCard';
import { ReadinessSummary } from '../dashboard/ReadinessSummary';
import { DailyPlanSummary } from '../dashboard/DailyPlanSummary';
import { RecommendedActions } from '../dashboard/RecommendedActions';
import { RecentActivity } from '../dashboard/RecentActivity';
import { WeakAreas } from '../dashboard/WeakAreas';
import { UpcomingItems } from '../dashboard/UpcomingItems';
import { SubscriptionSummary } from '../dashboard/SubscriptionSummary';

type DashboardState = 'loading' | 'error' | 'empty' | 'success';

export function DashboardPage() {
  const [state, setState] = useState<DashboardState>('loading');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const result = await getDashboardData();
      const hasAnyData = Object.values(result).some((v) => v != null && (Array.isArray(v) ? v.length > 0 : true));
      if (!hasAnyData) {
        setState('empty');
        setData(null);
      } else {
        setData(result);
        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (state === 'loading') {
    return (
      <StudentPageContainer maxWidth="xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-dark-elevated rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-dark-elevated rounded animate-pulse" />
          </div>
          <CardSkeleton />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState
          title="Failed to load dashboard"
          message={error || 'An unexpected error occurred'}
          onRetry={fetchDashboard}
        />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<RefreshCw className="h-6 w-6 text-gray-500" />}
          title="Welcome to PTE Master!"
          description="You haven't started any activities yet. Take a diagnostic test or start practicing to see your dashboard."
          action={
            <Button variant="primary" onClick={() => window.location.href = '/student/practice'}>
              Start Practicing
            </Button>
          }
        />
      </StudentPageContainer>
    );
  }

  const showGreeting = data?.greeting;
  const showContinueActivity = data?.continueActivity;
  const showTargetScore = data?.targetScore;
  const showExamDate = data?.examDate;
  const showReadiness = data?.readiness;
  const showDailyPlan = data?.dailyPlan;
  const showRecommended = data?.recommendedActions && data.recommendedActions.length > 0;
  const showRecentActivity = data?.recentActivity && data.recentActivity.length > 0;
  const showWeakAreas = data?.weakAreas && data.weakAreas.length > 0;
  const showUpcoming = data?.upcomingItems && data.upcomingItems.length > 0;
  const showSubscription = data?.subscription;

  return (
    <StudentPageContainer maxWidth="xl">
      <div className="space-y-6 min-w-0">
        {showGreeting && <DashboardGreeting data={data!.greeting} />}

        {showContinueActivity && <ContinueActivityCard data={data!.continueActivity} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showTargetScore && <TargetScoreCard data={data!.targetScore} />}
          {showExamDate && <ExamDateCard data={data!.examDate} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {showReadiness && <ReadinessSummary data={data!.readiness} />}
            {showDailyPlan && <DailyPlanSummary data={data!.dailyPlan} />}
            {showRecentActivity && <RecentActivity data={data!.recentActivity} />}
          </div>
          <div className="space-y-6">
            {showRecommended && <RecommendedActions data={data!.recommendedActions} />}
            {showWeakAreas && <WeakAreas data={data!.weakAreas} />}
            {showUpcoming && <UpcomingItems data={data!.upcomingItems} />}
            {showSubscription && <SubscriptionSummary data={data!.subscription} />}
          </div>
        </div>
      </div>
    </StudentPageContainer>
  );
}
