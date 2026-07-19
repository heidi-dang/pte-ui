import { Crown, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useStudentRoute } from '../StudentRouteContext';
import type { DashboardSubscription } from '../../../shared/api/dashboard';

interface SubscriptionSummaryProps {
  data?: DashboardSubscription;
}

export function SubscriptionSummary({ data }: SubscriptionSummaryProps) {
  const { navigate } = useStudentRoute();

  if (!data) return null;

  const isPremium = data.tier === 'premium';

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
            isPremium ? 'bg-primary-500/10' : 'bg-dark-elevated'
          }`}>
            <Crown className={`h-5 w-5 ${isPremium ? 'text-primary-400' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-100">
                {isPremium ? 'Premium' : 'Free'} Plan
              </span>
              <Badge variant={isPremium ? 'premium' : 'default'}>
                {isPremium ? 'Active' : 'Basic'}
              </Badge>
            </div>
            {isPremium && data.expiresAt && (
              <p className="text-xs text-gray-500 mt-0.5">
                Expires {new Date(data.expiresAt).toLocaleDateString()}
              </p>
            )}
            {!isPremium && (
              <p className="text-xs text-gray-500 mt-0.5">Upgrade for full access</p>
            )}
          </div>
        </div>
        {!isPremium && (
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate('subscription' as any)}
            className="shrink-0"
          >
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}
