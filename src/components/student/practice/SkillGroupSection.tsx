import type { ReactNode } from 'react';

interface SkillGroupSectionProps {
  title: string;
  count: number;
  children: ReactNode;
  key?: string | number;
}

export function SkillGroupSection({ title, count, children }: SkillGroupSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-100">{title}</h2>
        <span className="text-xs text-gray-500 bg-dark-elevated rounded-full px-2.5 py-0.5 font-medium">{count} tasks</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </section>
  );
}
