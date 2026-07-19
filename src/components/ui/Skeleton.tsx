import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const baseClass = 'animate-pulse rounded-md bg-dark-elevated';

export function Skeleton({ className = '', variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const style: CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const variants: Record<string, string> = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variants[variant]} ${className}`}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function CardSkeleton({ className = '' }: { className?: string; key?: string | number }) {
  return (
    <div className={`rounded-2xl border border-dark-border p-6 space-y-4 ${className}`}>
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}
