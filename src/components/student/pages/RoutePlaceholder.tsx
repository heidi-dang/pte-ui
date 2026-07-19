import { Construction } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';

interface RoutePlaceholderProps {
  title: string;
  route: string;
}

export function RoutePlaceholder({ title, route }: RoutePlaceholderProps) {
  return (
    <StudentPageContainer title={title} maxWidth="md">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-primary-500/10 flex items-center justify-center mb-4">
          <Construction className="h-8 w-8 text-primary-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-300">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">
          This page is under construction and will be implemented in a future phase.
        </p>
        <p className="mt-1 text-xs text-gray-600 font-mono">{route}</p>
      </div>
    </StudentPageContainer>
  );
}
