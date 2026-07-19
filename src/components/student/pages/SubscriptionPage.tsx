import { useEffect, useState } from 'react';
import { Crown, ChevronRight } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { ErrorState } from '../../ui/ErrorState';
import { Badge } from '../../ui/Badge';

interface SubscriptionInfo {
  tier: string;
  expiresAt?: string;
}

export function SubscriptionPage() {
  const [state, setState] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/student/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.subscription) {
          setSub(data.subscription);
        }
        setState('success');
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription info');
        setState('error');
      }
    };
    load();
  }, []);

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Subscription" maxWidth="md">
        <CardSkeleton />
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState title="Failed to load subscription" message={error || ''} />
      </StudentPageContainer>
    );
  }

  const isPremium = sub?.tier === 'premium';

  return (
    <StudentPageContainer title="Subscription" maxWidth="md">
      <div className="rounded-xl border border-dark-border bg-dark-surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary-500/10' : 'bg-dark-elevated'}`}>
            <Crown className={`h-6 w-6 ${isPremium ? 'text-primary-400' : 'text-gray-500'}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">
              {isPremium ? 'Premium' : 'Free'} Plan
            </h2>
            <Badge variant={isPremium ? 'premium' : 'default'}>
              {isPremium ? 'Active' : 'Basic'}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-dark-border">
            <span className="text-gray-500">Tier</span>
            <span className="text-gray-200 font-medium capitalize">{sub?.tier || 'free'}</span>
          </div>
          {sub?.expiresAt && (
            <div className="flex justify-between py-2 border-b border-dark-border">
              <span className="text-gray-500">Expires</span>
              <span className="text-gray-200 font-medium">{new Date(sub.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {!isPremium && (
          <div className="mt-6 p-4 rounded-xl bg-dark-surface-50 border border-dark-border">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Upgrade to Premium</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Get unlimited access to all practice questions, full-length mock exams, detailed analytics, and AI-powered feedback.
            </p>
          </div>
        )}
      </div>
    </StudentPageContainer>
  );
}
