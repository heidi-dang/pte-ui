import { useEffect, useState, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { EmptyState } from '../../ui/EmptyState';

export function AchievementsPage() {
  return (
    <StudentPageContainer maxWidth="md">
      <EmptyState
        icon={<Trophy className="h-6 w-6 text-gray-500" />}
        title="Achievements"
        description="Achievements are not available yet. This feature will be added in a future update."
      />
    </StudentPageContainer>
  );
}
