import React from 'react';
import { ErrorState } from './ErrorState';

export class ErrorBoundary extends React.Component {
  constructor(props: Record<string, unknown>) {
    super(props);
    (this as Record<string, unknown>).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Record<string, unknown> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info);
  }

  render(): React.ReactNode {
    const st = (this as Record<string, unknown>).state as { hasError: boolean; error: Error | null };
    const pr = (this as Record<string, unknown>).props as { children?: React.ReactNode };
    const setSt = (this as Record<string, unknown>).setState as (s: Record<string, unknown>) => void;

    if (st.hasError) {
      return (
        <ErrorState
          title="Page could not load"
          message={st.error?.message || 'An unexpected error occurred'}
          onRetry={(): void => setSt({ hasError: false, error: null })}
        />
      );
    }
    return pr.children;
  }
}
