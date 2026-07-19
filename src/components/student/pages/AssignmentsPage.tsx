import { useEffect, useState, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { EmptyState } from '../../ui/EmptyState';

export function AssignmentsPage() {
  return (
    <StudentPageContainer maxWidth="md">
      <EmptyState
        icon={<ClipboardList className="h-6 w-6 text-gray-500" />}
        title="Assignments"
        description="Assignments are not available yet. This feature will be added in a future update."
      />
    </StudentPageContainer>
  );
}
